import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { availableCars, availableHomes } from "../../data/assets";
import { availablePersonalLoans, availableCreditCards } from "../../data/loans";
import { netWorth, creditScoreLabel } from "../../engine/lifeEngine";
import { colors, fonts, fontSize, spacing } from "../../theme";
import { tabStyles } from "./sharedStyles";

const EXTRA_PAYMENT = 500;

function creditScoreColor(score: number): string {
  if (score >= 670) return colors.primary;
  if (score >= 580) return colors.gold;
  return colors.danger;
}

export default function AssetsTab() {
  const character = useGameStore((s) => s.character);
  const buyCar = useGameStore((s) => s.buyCar);
  const sellCar = useGameStore((s) => s.sellCar);
  const buyHome = useGameStore((s) => s.buyHome);
  const sellHome = useGameStore((s) => s.sellHome);
  const takeOutLoan = useGameStore((s) => s.takeOutLoan);
  const openCreditCard = useGameStore((s) => s.openCreditCard);
  const payDownLoan = useGameStore((s) => s.payDownLoan);
  const chargeCard = useGameStore((s) => s.chargeCard);

  if (!character) return null;

  const cars = availableCars(character.age);
  const homes = availableHomes(character.age);
  const creditScore = character.creditScore ?? 650;
  const loans = character.loans ?? [];
  const hasCard = loans.some((l) => l.kind === "creditCard");
  const loanListings = availablePersonalLoans(character.age, creditScore);
  const cardListings = availableCreditCards(character.age, creditScore);

  return (
    <ScrollView contentContainerStyle={tabStyles.scroll}>
      <Card style={styles.netWorthCard}>
        <Text style={styles.netWorthLabel}>Net Worth</Text>
        <Text style={styles.netWorthValue}>${netWorth(character).toLocaleString()}</Text>
      </Card>

      <Card>
        <View style={styles.headerRow}>
          <Ionicons name="car-sport" size={18} color={colors.primary} />
          <Text style={tabStyles.sectionTitle}>Car</Text>
        </View>
        {character.car ? (
          <View>
            <View style={styles.ownedRow}>
              <Text style={styles.ownedName}>{character.car.name}</Text>
              <Text style={styles.ownedValue}>${character.car.value.toLocaleString()}</Text>
            </View>
            <Button label="Sell car" icon="cash" variant="danger" onPress={sellCar} />
          </View>
        ) : cars.length === 0 ? (
          <Text style={tabStyles.logLine}>Too young to buy a car yet.</Text>
        ) : (
          cars.map((listing) => (
            <TouchableOpacity
              key={listing.name}
              accessibilityRole="button"
              activeOpacity={0.7}
              style={[styles.listingRow, character.money < listing.price && styles.listingDisabled]}
              onPress={() => buyCar(listing)}
            >
              <Text style={styles.listingName}>{listing.name}</Text>
              <Text style={styles.listingPrice}>${listing.price.toLocaleString()}</Text>
            </TouchableOpacity>
          ))
        )}
      </Card>

      <Card>
        <View style={styles.headerRow}>
          <Ionicons name="home" size={18} color={colors.primary} />
          <Text style={tabStyles.sectionTitle}>Home</Text>
        </View>
        {character.home ? (
          <View>
            <View style={styles.ownedRow}>
              <Text style={styles.ownedName}>{character.home.name}</Text>
              <Text style={styles.ownedValue}>${character.home.value.toLocaleString()}</Text>
            </View>
            {character.home.mortgageBalance > 0 ? (
              <Text style={tabStyles.logLine}>
                Mortgage remaining: ${character.home.mortgageBalance.toLocaleString()} (${character.home.yearlyPayment.toLocaleString()}/yr)
              </Text>
            ) : (
              <Text style={tabStyles.logLine}>Paid off — you own this outright.</Text>
            )}
            <Button label="Sell home" icon="cash" variant="danger" onPress={sellHome} style={styles.sellHomeBtn} />
          </View>
        ) : homes.length === 0 ? (
          <Text style={tabStyles.logLine}>Too young to buy a home yet.</Text>
        ) : (
          homes.map((listing) => {
            const downPayment = Math.round(listing.price * 0.2);
            return (
              <TouchableOpacity
                key={listing.name}
                accessibilityRole="button"
                activeOpacity={0.7}
                style={[styles.listingRow, character.money < downPayment && styles.listingDisabled]}
                onPress={() => buyHome(listing)}
              >
                <View>
                  <Text style={styles.listingName}>{listing.name}</Text>
                  <Text style={styles.listingSub}>${downPayment.toLocaleString()} down</Text>
                </View>
                <Text style={styles.listingPrice}>${listing.price.toLocaleString()}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </Card>

      <Card>
        <View style={styles.headerRow}>
          <Ionicons name="card" size={18} color={colors.primary} />
          <Text style={tabStyles.sectionTitle}>Credit & Loans</Text>
        </View>

        <View style={styles.creditScoreRow}>
          <Text style={styles.creditScoreLabel}>Credit Score</Text>
          <View style={styles.creditScoreValueWrap}>
            <Text style={[styles.creditScoreValue, { color: creditScoreColor(creditScore) }]}>{creditScore}</Text>
            <Text style={[styles.creditScoreTag, { color: creditScoreColor(creditScore) }]}>
              {creditScoreLabel(creditScore)}
            </Text>
          </View>
        </View>

        {loans.length > 0 && (
          <View style={styles.loansList}>
            {loans.map((loan) => (
              <View key={loan.id} style={styles.loanRow}>
                <View style={styles.loanHeaderRow}>
                  <Text style={styles.ownedName}>{loan.name}</Text>
                  <Text style={styles.ownedValue}>${loan.balance.toLocaleString()}</Text>
                </View>
                <Text style={tabStyles.logLine}>
                  {loan.kind === "creditCard"
                    ? `${(loan.apr * 100).toFixed(0)}% APR · $${(loan.limit ?? 0).toLocaleString()} limit`
                    : `${(loan.apr * 100).toFixed(0)}% APR · $${loan.minPayment.toLocaleString()}/yr`}
                </Text>
                <View style={styles.loanBtnRow}>
                  {loan.kind === "creditCard" && (
                    <Button
                      label={`Charge $${EXTRA_PAYMENT}`}
                      icon="card"
                      size="sm"
                      variant="secondary"
                      disabled={(loan.limit ?? 0) - loan.balance < EXTRA_PAYMENT}
                      onPress={() => chargeCard(loan.id, EXTRA_PAYMENT)}
                    />
                  )}
                  <Button
                    label={`Pay extra $${EXTRA_PAYMENT}`}
                    icon="cash"
                    size="sm"
                    variant="secondary"
                    disabled={character.money < EXTRA_PAYMENT || loan.balance <= 0}
                    onPress={() => payDownLoan(loan.id, EXTRA_PAYMENT)}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {!hasCard &&
          (cardListings.length === 0 ? (
            <Text style={tabStyles.logLine}>No credit cards available yet.</Text>
          ) : (
            cardListings.map((listing) => (
              <TouchableOpacity
                key={listing.name}
                accessibilityRole="button"
                activeOpacity={0.7}
                style={styles.listingRow}
                onPress={() => openCreditCard(listing)}
              >
                <View>
                  <Text style={styles.listingName}>{listing.name}</Text>
                  <Text style={styles.listingSub}>{(listing.apr * 100).toFixed(0)}% APR</Text>
                </View>
                <Text style={styles.listingPrice}>${listing.limit.toLocaleString()} limit</Text>
              </TouchableOpacity>
            ))
          ))}

        {loanListings.length > 0 && (
          <View style={styles.loanListingsWrap}>
            <Text style={styles.subheading}>Personal loans</Text>
            {loanListings.map((listing) => (
              <TouchableOpacity
                key={listing.name}
                accessibilityRole="button"
                activeOpacity={0.7}
                style={styles.listingRow}
                onPress={() => takeOutLoan(listing)}
              >
                <View>
                  <Text style={styles.listingName}>{listing.name}</Text>
                  <Text style={styles.listingSub}>
                    {(listing.apr * 100).toFixed(0)}% APR · {listing.termYears}yr
                  </Text>
                </View>
                <Text style={styles.listingPrice}>${listing.amount.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  netWorthCard: {
    alignItems: "center",
  },
  netWorthLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    marginBottom: 4,
  },
  netWorthValue: {
    color: colors.primary,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.display,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  ownedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  ownedName: {
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.base,
  },
  ownedValue: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
  },
  sellHomeBtn: {
    marginTop: spacing.sm,
  },
  creditScoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  creditScoreLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.base,
  },
  creditScoreValueWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  creditScoreValue: {
    fontFamily: fonts.extraBold,
    fontSize: fontSize.xl,
  },
  creditScoreTag: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
  },
  loansList: {
    marginBottom: spacing.sm,
  },
  loanRow: {
    marginBottom: spacing.sm + 2,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  loanHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  loanBtnRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs + 2,
  },
  subheading: {
    color: colors.textMuted,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  loanListingsWrap: {
    marginTop: 2,
  },
  listingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listingDisabled: {
    opacity: 0.4,
  },
  listingName: {
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
  },
  listingSub: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
  },
  listingPrice: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
  },
});
