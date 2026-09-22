import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { availableCars, availableHomes } from "../../data/assets";
import { netWorth } from "../../engine/lifeEngine";
import { colors, fonts, fontSize, spacing } from "../../theme";
import { tabStyles } from "./sharedStyles";

export default function AssetsTab() {
  const character = useGameStore((s) => s.character);
  const buyCar = useGameStore((s) => s.buyCar);
  const sellCar = useGameStore((s) => s.sellCar);
  const buyHome = useGameStore((s) => s.buyHome);
  const sellHome = useGameStore((s) => s.sellHome);

  if (!character) return null;

  const cars = availableCars(character.age);
  const homes = availableHomes(character.age);

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
