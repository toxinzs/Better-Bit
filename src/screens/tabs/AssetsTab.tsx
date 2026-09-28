import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Section from "../../components/Section";
import GradientBg from "../../components/GradientBg";
import { availableCars, availableHomes } from "../../data/assets";
import { availablePersonalLoans, availableCreditCards } from "../../data/loans";
import { STOCK_DEFS } from "../../data/stocks";
import { totalNetWorth, creditScoreLabel, portfolioValue } from "../../engine/lifeEngine";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";
import { tabStyles } from "./sharedStyles";

const EXTRA_PAYMENT = 500;
const BUY_AMOUNT = 500;

function creditScoreColor(score: number): string {
  if (score >= 670) return colors.primary;
  if (score >= 580) return colors.gold;
  return colors.danger;
}

export default function AssetsTab() {
  const character = useGameStore((s) => s.character);
  const worldState = useGameStore((s) => s.worldState);
  const buyCar = useGameStore((s) => s.buyCar);
  const sellCar = useGameStore((s) => s.sellCar);
  const buyHome = useGameStore((s) => s.buyHome);
  const sellHome = useGameStore((s) => s.sellHome);
  const takeOutLoan = useGameStore((s) => s.takeOutLoan);
  const openCreditCard = useGameStore((s) => s.openCreditCard);
  const payDownLoan = useGameStore((s) => s.payDownLoan);
  const chargeCard = useGameStore((s) => s.chargeCard);
  const buyStock = useGameStore((s) => s.buyStock);
  const sellStock = useGameStore((s) => s.sellStock);
  const setContributionRate = useGameStore((s) => s.setContributionRate);
  const withdrawRetirement = useGameStore((s) => s.withdrawRetirement);

  if (!character) return null;

  const cars = availableCars(character.age);
  const homes = availableHomes(character.age);
  const creditScore = character.creditScore ?? 650;
  const loans = character.loans ?? [];
  const hasCard = loans.some((l) => l.kind === "creditCard");
  const loanListings = availablePersonalLoans(character.age, creditScore);
  const cardListings = availableCreditCards(character.age, creditScore);
  const retirement = character.retirement ?? { balance: 0, contributionRate: 0 };
  const contributionPercent = Math.round(retirement.contributionRate * 100);
  const stocks = worldState.stocks ?? [];
  const portfolio = character.portfolio ?? [];

  const debtTotal = loans.reduce((sum, l) => sum + l.balance, 0) + (character.home?.mortgageBalance ?? 0);
  const investTotal = portfolioValue(character, worldState);
  const netWorth = totalNetWorth(character, worldState);
  const carSummary = character.car ? `$${character.car.value.toLocaleString()}` : "None";
  const homeSummary = character.home ? `$${character.home.value.toLocaleString()}` : "None";
  const debtSummary = debtTotal > 0 ? `-$${debtTotal.toLocaleString()}` : `Score ${creditScore}`;
  const investSummary = investTotal > 0 ? `$${investTotal.toLocaleString()}` : "None";
  const retireSummary = `$${retirement.balance.toLocaleString()}`;

  return (
    <ScrollView contentContainerStyle={tabStyles.scroll}>
      <GradientBg id="moneyHero" from="#124a2e" to="#171726" radius={radii.lg} style={styles.hero}>
        <Text style={styles.netWorthLabel}>NET WORTH</Text>
        <Text style={styles.netWorthValue}>${netWorth.toLocaleString()}</Text>
        <View style={styles.heroTiles}>
          <View style={styles.heroTile}>
            <Text style={styles.heroTileLabel}>Cash</Text>
            <Text style={styles.heroTileValue}>${character.money.toLocaleString()}</Text>
          </View>
          <View style={styles.heroTile}>
            <Text style={styles.heroTileLabel}>Invested</Text>
            <Text style={styles.heroTileValue}>${(investTotal + retirement.balance).toLocaleString()}</Text>
          </View>
          <View style={styles.heroTile}>
            <Text style={styles.heroTileLabel}>Debt</Text>
            <Text style={[styles.heroTileValue, debtTotal > 0 && { color: colors.danger }]}>
              {debtTotal > 0 ? `-$${debtTotal.toLocaleString()}` : "$0"}
            </Text>
          </View>
        </View>
      </GradientBg>

      <Section title="Car" icon="car-sport" color="#4d9fef" summary={carSummary} defaultOpen={false}>
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
      </Section>

      <Section title="Home" icon="home" color="#f5b942" summary={homeSummary} defaultOpen={false}>
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
      </Section>

      <Section title="Credit & Loans" icon="card" color="#f87171" summary={debtSummary} defaultOpen={false}>

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
      </Section>

      <Section title="Investments" icon="trending-up" color="#2ecc71" summary={investSummary} defaultOpen={false}>

        {character.age < 18 ? (
          <Text style={tabStyles.logLine}>Too young to open a brokerage account yet.</Text>
        ) : (
          <>
            {portfolio.length > 0 && (
              <View style={styles.loansList}>
                {portfolio.map((holding) => {
                  const stock = stocks.find((s) => s.ticker === holding.ticker);
                  const def = STOCK_DEFS.find((d) => d.ticker === holding.ticker);
                  const price = stock?.price ?? 0;
                  const value = Math.round(price * holding.shares);
                  const gain = value - holding.costBasis;
                  return (
                    <View key={holding.ticker} style={styles.loanRow}>
                      <View style={styles.loanHeaderRow}>
                        <Text style={styles.ownedName}>
                          {holding.ticker} · {holding.shares} sh
                        </Text>
                        <Text style={styles.ownedValue}>${value.toLocaleString()}</Text>
                      </View>
                      <Text style={tabStyles.logLine}>
                        {def?.name ?? holding.ticker} · ${price.toFixed(2)}/sh ·{" "}
                        <Text style={{ color: gain >= 0 ? colors.primary : colors.danger }}>
                          {gain >= 0 ? "+" : "-"}${Math.abs(Math.round(gain)).toLocaleString()}
                        </Text>
                      </Text>
                      <View style={styles.loanBtnRow}>
                        <Button
                          label="Sell all"
                          icon="cash"
                          size="sm"
                          variant="secondary"
                          onPress={() => sellStock(holding.ticker, holding.shares)}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <Text style={styles.subheading}>Market</Text>
            {stocks.map((stock) => {
              const def = STOCK_DEFS.find((d) => d.ticker === stock.ticker);
              const changePct = stock.prevPrice > 0 ? ((stock.price - stock.prevPrice) / stock.prevPrice) * 100 : 0;
              const shares = Math.floor(BUY_AMOUNT / stock.price);
              return (
                <View key={stock.ticker} style={styles.loanRow}>
                  <View style={styles.loanHeaderRow}>
                    <Text style={styles.ownedName}>
                      {stock.ticker} · {def?.name ?? stock.ticker}
                    </Text>
                    <Text style={styles.ownedValue}>${stock.price.toFixed(2)}</Text>
                  </View>
                  <Text style={tabStyles.logLine}>
                    {def?.sector ?? ""} ·{" "}
                    <Text style={{ color: changePct >= 0 ? colors.primary : colors.danger }}>
                      {changePct >= 0 ? "+" : ""}
                      {changePct.toFixed(1)}% this year
                    </Text>
                  </Text>
                  <View style={styles.loanBtnRow}>
                    <Button
                      label={`Buy $${BUY_AMOUNT} (${shares} sh)`}
                      icon="trending-up"
                      size="sm"
                      variant="secondary"
                      disabled={shares < 1 || character.money < shares * stock.price}
                      onPress={() => buyStock(stock.ticker, shares)}
                    />
                  </View>
                </View>
              );
            })}
          </>
        )}
      </Section>

      <Section title="Retirement" icon="umbrella" color="#b370e0" summary={retireSummary} defaultOpen={false}>

        <View style={styles.creditScoreRow}>
          <Text style={styles.creditScoreLabel}>Balance</Text>
          <Text style={[styles.creditScoreValue, { color: colors.primary }]}>${retirement.balance.toLocaleString()}</Text>
        </View>

        <View style={styles.contribRow}>
          <Text style={styles.creditScoreLabel}>Contribution</Text>
          <View style={styles.contribControls}>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.7}
              style={styles.stepperBtn}
              onPress={() => setContributionRate(Math.max(0, contributionPercent - 1))}
            >
              <Ionicons name="remove" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.contribValue}>{contributionPercent}%</Text>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.7}
              style={styles.stepperBtn}
              onPress={() => setContributionRate(Math.min(50, contributionPercent + 1))}
            >
              <Ionicons name="add" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={tabStyles.logLine}>
          Pre-tax, comes off your paycheck automatically. Your employer matches 50% of the first 6%
          {character.job ? "" : " — start a job to actually contribute"}.
        </Text>

        <View style={styles.loanBtnRow}>
          <Button
            label="Withdraw $1,000"
            icon="cash"
            size="sm"
            variant="secondary"
            disabled={retirement.balance < 1000}
            onPress={() => withdrawRetirement(1000)}
          />
        </View>
        {character.age < 60 && (
          <Text style={styles.subheading}>10% early-withdrawal penalty before age 60</Text>
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  netWorthCard: {
    alignItems: "center",
  },
  hero: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  heroTiles: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  heroTile: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: "center",
  },
  heroTileLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xs,
  },
  heroTileValue: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.base,
    marginTop: 2,
  },
  netWorthLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: fontSize.xs,
    letterSpacing: 1.5,
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
  contribRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  contribControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stepperBtn: {
    backgroundColor: colors.surfaceRaised,
    width: 30,
    height: 30,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  contribValue: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.lg,
    minWidth: 42,
    textAlign: "center",
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
