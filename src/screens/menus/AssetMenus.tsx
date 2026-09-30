import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import { useNav } from "../../nav/navStore";
import MenuScreen, { MenuRow } from "../../nav/MenuScreen";
import Card from "../../components/Card";
import Button from "../../components/Button";
import GradientBg from "../../components/GradientBg";
import { availableCars } from "../../data/assets";
import { homeListingsFor } from "../../engine/location";
import { cityOf } from "../../engine/where";
import { availablePersonalLoans, availableCreditCards } from "../../data/loans";
import { STOCK_DEFS } from "../../data/stocks";
import { totalNetWorth, creditScoreLabel, portfolioValue } from "../../engine/lifeEngine";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";
import { tabStyles } from "../tabs/sharedStyles";
import { ms } from "./menuStyles";

const EXTRA_PAYMENT = 500;
const BUY_AMOUNT = 500;

function creditScoreColor(score: number): string {
  if (score >= 670) return colors.primary;
  if (score >= 580) return colors.gold;
  return colors.danger;
}

// ---------- the hub ----------

export function AssetsHub() {
  const character = useGameStore((s) => s.character);
  const worldState = useGameStore((s) => s.worldState);
  const push = useNav((s) => s.push);
  if (!character) return null;

  const loans = character.loans ?? [];
  const retirement = character.retirement ?? { balance: 0, contributionRate: 0 };
  const debtTotal = loans.reduce((sum, l) => sum + l.balance, 0) + (character.home?.mortgageBalance ?? 0);
  const investTotal = portfolioValue(character, worldState);
  const netWorth = totalNetWorth(character, worldState);
  const score = character.creditScore ?? 650;

  return (
    <ScrollView contentContainerStyle={tabStyles.scroll} showsVerticalScrollIndicator={false}>
      <GradientBg id="moneyHero" from={colors.gradMoney} to={colors.surface} radius={radii.lg} style={styles.hero}>
        <Text style={styles.netWorthLabel}>NET WORTH</Text>
        <Text style={styles.netWorthValue}>${netWorth.toLocaleString()}</Text>
        <View style={styles.heroTiles}>
          <Tile label="Cash" value={`$${character.money.toLocaleString()}`} />
          <Tile label="Invested" value={`$${(investTotal + retirement.balance).toLocaleString()}`} />
          <Tile label="Debt" value={debtTotal > 0 ? `-$${debtTotal.toLocaleString()}` : "$0"} danger={debtTotal > 0} />
        </View>
      </GradientBg>

      <MenuRow icon="home" color={colors.gold} title="Home & Moving" summary={`${cityOf(character).name} · ${character.home ? character.home.name : character.residence?.housing === "rent" ? "Renting" : character.residence?.housing === "own" ? "Homeowner" : "With family"}`} delay={0} onPress={() => push("place")} />
      <MenuRow icon="wallet" color={colors.primary} title="Budget" summary="Where the money goes" delay={20} onPress={() => push("budget")} />
      <MenuRow icon="car-sport" color={colors.smarts} title="Vehicle" summary={character.car ? `${character.car.name} · $${character.car.value.toLocaleString()}` : "No car"} delay={40} onPress={() => push("car")} />
      <MenuRow icon="card" color={colors.danger} title="Credit & Loans" summary={debtTotal > 0 ? `Debt $${debtTotal.toLocaleString()}` : `Credit score ${score}`} delay={80} onPress={() => push("loans")} />
      <MenuRow icon="trending-up" color={colors.primary} title="Investments" summary={investTotal > 0 ? `$${investTotal.toLocaleString()}` : "Nothing invested"} delay={120} onPress={() => push("invest")} />
      <MenuRow icon="business" color={colors.gold} title="Property investments" summary={(character.rentals ?? []).length > 0 ? `${character.rentals!.length} rental${character.rentals!.length === 1 ? "" : "s"}` : "Buy to let"} delay={140} onPress={() => push("rentals")} />
      <MenuRow icon="receipt" color={colors.danger} title="Taxes" summary="What you pay and what you get back" delay={150} onPress={() => push("taxes")} />
      {(debtTotal > 0 || character.money < 0) && <MenuRow icon="warning" color={colors.danger} title="Bankruptcy" summary="A last resort" delay={155} onPress={() => push("bankrupt")} />}
      <MenuRow icon="umbrella" color={colors.looks} title="Retirement" summary={`$${retirement.balance.toLocaleString()} saved`} delay={160} onPress={() => push("retire")} />
    </ScrollView>
  );
}

function Tile({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <View style={styles.heroTile}>
      <Text style={styles.heroTileLabel}>{label}</Text>
      <Text style={[styles.heroTileValue, danger && { color: colors.danger }]}>{value}</Text>
    </View>
  );
}

// ---------- car ----------

export function CarMenu() {
  const character = useGameStore((s) => s.character);
  const buyCar = useGameStore((s) => s.buyCar);
  const sellCar = useGameStore((s) => s.sellCar);
  if (!character) return null;
  const cars = availableCars(character.age);
  return (
    <MenuScreen title="Vehicle" icon="car-sport" color={colors.smarts}>
      <Card>
        {character.car ? (
          <View>
            <View style={ms.ownedRow}>
              <Text style={ms.ownedName}>{character.car.name}</Text>
              <Text style={ms.ownedValue}>${character.car.value.toLocaleString()}</Text>
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
              style={[ms.listingRow, character.money < listing.price && ms.listingDisabled]}
              onPress={() => buyCar(listing)}
            >
              <Text style={ms.listingName}>{listing.name}</Text>
              <Text style={ms.listingPrice}>${listing.price.toLocaleString()}</Text>
            </TouchableOpacity>
          ))
        )}
      </Card>
    </MenuScreen>
  );
}

// ---------- home ----------

export function HomeMenu() {
  const character = useGameStore((s) => s.character);
  const buyHome = useGameStore((s) => s.buyHome);
  const sellHome = useGameStore((s) => s.sellHome);
  if (!character) return null;
  const homes = character.age >= 18 ? homeListingsFor(character) : [];
  return (
    <MenuScreen title="Home" icon="home" color={colors.gold}>
      <Card>
        {character.home ? (
          <View>
            <View style={ms.ownedRow}>
              <Text style={ms.ownedName}>{character.home.name}</Text>
              <Text style={ms.ownedValue}>${character.home.value.toLocaleString()}</Text>
            </View>
            {character.home.mortgageBalance > 0 ? (
              <Text style={tabStyles.logLine}>
                Mortgage remaining: ${character.home.mortgageBalance.toLocaleString()} (${character.home.yearlyPayment.toLocaleString()}/yr)
              </Text>
            ) : (
              <Text style={tabStyles.logLine}>Paid off - you own this outright.</Text>
            )}
            <Button label="Sell home" icon="cash" variant="danger" onPress={sellHome} style={{ marginTop: spacing.sm }} />
          </View>
        ) : homes.length === 0 ? (
          <Text style={tabStyles.logLine}>Too young to buy a home yet.</Text>
        ) : (
          homes.map((listing) => {
            const down = Math.round(listing.price * 0.2);
            return (
              <TouchableOpacity
                key={listing.name}
                accessibilityRole="button"
                activeOpacity={0.7}
                style={[ms.listingRow, character.money < down && ms.listingDisabled]}
                onPress={() => buyHome(listing)}
              >
                <View>
                  <Text style={ms.listingName}>{listing.name}</Text>
                  <Text style={ms.listingSub}>${down.toLocaleString()} down</Text>
                </View>
                <Text style={ms.listingPrice}>${listing.price.toLocaleString()}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </Card>
    </MenuScreen>
  );
}

// ---------- credit & loans ----------

export function LoansMenu() {
  const character = useGameStore((s) => s.character);
  const takeOutLoan = useGameStore((s) => s.takeOutLoan);
  const openCreditCard = useGameStore((s) => s.openCreditCard);
  const payDownLoan = useGameStore((s) => s.payDownLoan);
  const chargeCard = useGameStore((s) => s.chargeCard);
  if (!character) return null;
  const score = character.creditScore ?? 650;
  const loans = character.loans ?? [];
  const hasCard = loans.some((l) => l.kind === "creditCard");
  const loanListings = availablePersonalLoans(character.age, score);
  const cardListings = availableCreditCards(character.age, score);
  return (
    <MenuScreen title="Credit & Loans" icon="card" color={colors.danger}>
      <Card>
        <View style={ms.statRow}>
          <Text style={ms.statLabel}>Credit Score</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <Text style={[ms.statValue, { color: creditScoreColor(score) }]}>{score}</Text>
            <Text style={{ color: creditScoreColor(score), fontFamily: fonts.semiBold, fontSize: fontSize.sm }}>{creditScoreLabel(score)}</Text>
          </View>
        </View>

        {loans.length > 0 && (
          <View style={{ marginBottom: spacing.sm }}>
            {loans.map((loan) => (
              <View key={loan.id} style={ms.rowBlock}>
                <View style={ms.rowHead}>
                  <Text style={ms.ownedName}>{loan.name}</Text>
                  <Text style={ms.ownedValue}>${loan.balance.toLocaleString()}</Text>
                </View>
                <Text style={tabStyles.logLine}>
                  {loan.kind === "creditCard"
                    ? `${(loan.apr * 100).toFixed(0)}% APR · $${(loan.limit ?? 0).toLocaleString()} limit`
                    : `${(loan.apr * 100).toFixed(0)}% APR · $${loan.minPayment.toLocaleString()}/yr`}
                </Text>
                <View style={ms.btnRow}>
                  {loan.kind === "creditCard" && (
                    <Button label={`Charge $${EXTRA_PAYMENT}`} icon="card" size="sm" variant="secondary" disabled={(loan.limit ?? 0) - loan.balance < EXTRA_PAYMENT} onPress={() => chargeCard(loan.id, EXTRA_PAYMENT)} />
                  )}
                  <Button label={`Pay extra $${EXTRA_PAYMENT}`} icon="cash" size="sm" variant="secondary" disabled={character.money < EXTRA_PAYMENT || loan.balance <= 0} onPress={() => payDownLoan(loan.id, EXTRA_PAYMENT)} />
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
              <TouchableOpacity key={listing.name} accessibilityRole="button" activeOpacity={0.7} style={ms.listingRow} onPress={() => openCreditCard(listing)}>
                <View>
                  <Text style={ms.listingName}>{listing.name}</Text>
                  <Text style={ms.listingSub}>{(listing.apr * 100).toFixed(0)}% APR</Text>
                </View>
                <Text style={ms.listingPrice}>${listing.limit.toLocaleString()} limit</Text>
              </TouchableOpacity>
            ))
          ))}

        {loanListings.length > 0 && (
          <View style={{ marginTop: 2 }}>
            <Text style={ms.subheading}>Personal loans</Text>
            {loanListings.map((listing) => (
              <TouchableOpacity key={listing.name} accessibilityRole="button" activeOpacity={0.7} style={ms.listingRow} onPress={() => takeOutLoan(listing)}>
                <View>
                  <Text style={ms.listingName}>{listing.name}</Text>
                  <Text style={ms.listingSub}>{(listing.apr * 100).toFixed(0)}% APR · {listing.termYears}yr</Text>
                </View>
                <Text style={ms.listingPrice}>${listing.amount.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>
    </MenuScreen>
  );
}

// ---------- investments ----------

export function InvestMenu() {
  const character = useGameStore((s) => s.character);
  const worldState = useGameStore((s) => s.worldState);
  const buyStock = useGameStore((s) => s.buyStock);
  const sellStock = useGameStore((s) => s.sellStock);
  if (!character) return null;
  const stocks = worldState.stocks ?? [];
  const portfolio = character.portfolio ?? [];
  return (
    <MenuScreen title="Investments" icon="trending-up" color={colors.primary}>
      <Card>
        {character.age < 18 ? (
          <Text style={tabStyles.logLine}>Too young to open a brokerage account yet.</Text>
        ) : (
          <>
            {portfolio.length > 0 && (
              <View style={{ marginBottom: spacing.sm }}>
                <Text style={ms.subheading}>Your holdings</Text>
                {portfolio.map((holding) => {
                  const stock = stocks.find((s) => s.ticker === holding.ticker);
                  const def = STOCK_DEFS.find((d) => d.ticker === holding.ticker);
                  const price = stock?.price ?? 0;
                  const value = Math.round(price * holding.shares);
                  const gain = value - holding.costBasis;
                  return (
                    <View key={holding.ticker} style={ms.rowBlock}>
                      <View style={ms.rowHead}>
                        <Text style={ms.ownedName}>{holding.ticker} · {holding.shares} sh</Text>
                        <Text style={ms.ownedValue}>${value.toLocaleString()}</Text>
                      </View>
                      <Text style={tabStyles.logLine}>
                        {def?.name ?? holding.ticker} · ${price.toFixed(2)}/sh ·{" "}
                        <Text style={{ color: gain >= 0 ? colors.primary : colors.danger }}>
                          {gain >= 0 ? "+" : "-"}${Math.abs(Math.round(gain)).toLocaleString()}
                        </Text>
                      </Text>
                      <View style={ms.btnRow}>
                        <Button label="Sell all" icon="cash" size="sm" variant="secondary" onPress={() => sellStock(holding.ticker, holding.shares)} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
            <Text style={ms.subheading}>Market</Text>
            {stocks.map((stock) => {
              const def = STOCK_DEFS.find((d) => d.ticker === stock.ticker);
              const changePct = stock.prevPrice > 0 ? ((stock.price - stock.prevPrice) / stock.prevPrice) * 100 : 0;
              const shares = Math.floor(BUY_AMOUNT / stock.price);
              return (
                <View key={stock.ticker} style={ms.rowBlock}>
                  <View style={ms.rowHead}>
                    <Text style={ms.ownedName}>{stock.ticker} · {def?.name ?? stock.ticker}</Text>
                    <Text style={ms.ownedValue}>${stock.price.toFixed(2)}</Text>
                  </View>
                  <Text style={tabStyles.logLine}>
                    {def?.sector ?? ""} ·{" "}
                    <Text style={{ color: changePct >= 0 ? colors.primary : colors.danger }}>
                      {changePct >= 0 ? "+" : ""}{changePct.toFixed(1)}% this year
                    </Text>
                  </Text>
                  <View style={ms.btnRow}>
                    <Button label={`Buy $${BUY_AMOUNT} (${shares} sh)`} icon="trending-up" size="sm" variant="secondary" disabled={shares < 1 || character.money < shares * stock.price} onPress={() => buyStock(stock.ticker, shares)} />
                  </View>
                </View>
              );
            })}
          </>
        )}
      </Card>
    </MenuScreen>
  );
}

// ---------- retirement ----------

export function RetireMenu() {
  const character = useGameStore((s) => s.character);
  const setRate = useGameStore((s) => s.setContributionRate);
  const withdraw = useGameStore((s) => s.withdrawRetirement);
  if (!character) return null;
  const retirement = character.retirement ?? { balance: 0, contributionRate: 0 };
  const pct = Math.round(retirement.contributionRate * 100);
  return (
    <MenuScreen title="Retirement" icon="umbrella" color={colors.looks}>
      <Card>
        <View style={ms.statRow}>
          <Text style={ms.statLabel}>Balance</Text>
          <Text style={[ms.statValue, { color: colors.primary }]}>${retirement.balance.toLocaleString()}</Text>
        </View>
        <View style={[ms.statRow, { borderBottomWidth: 0, marginBottom: spacing.sm }]}>
          <Text style={ms.statLabel}>Contribution</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Decrease" activeOpacity={0.7} style={ms.stepper} onPress={() => setRate(Math.max(0, pct - 1))}>
              <Ionicons name="remove" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={{ color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: fontSize.lg, minWidth: 42, textAlign: "center" }}>{pct}%</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Increase" activeOpacity={0.7} style={ms.stepper} onPress={() => setRate(Math.min(50, pct + 1))}>
              <Ionicons name="add" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={tabStyles.logLine}>
          Pre-tax, comes off your paycheck automatically. Your employer matches 50% of the first 6%{character.job ? "" : " - start a job to actually contribute"}.
        </Text>
        <View style={ms.btnRow}>
          <Button label="Withdraw $1,000" icon="cash" size="sm" variant="secondary" disabled={retirement.balance < 1000} onPress={() => withdraw(1000)} />
        </View>
        {character.age < 60 && <Text style={ms.subheading}>10% early-withdrawal penalty before age 60</Text>}
      </Card>
    </MenuScreen>
  );
}

const styles = StyleSheet.create({
  hero: { padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, alignItems: "center" },
  heroTiles: { alignSelf: "stretch", flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  heroTile: { flex: 1, backgroundColor: colors.shade, borderRadius: radii.md, padding: spacing.md, alignItems: "center" },
  heroTileLabel: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.xs },
  heroTileValue: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: fontSize.base, marginTop: 2 },
  netWorthLabel: { color: colors.textSecondary, fontFamily: fonts.bold, fontSize: fontSize.xs, letterSpacing: 1.5, marginBottom: 4 },
  netWorthValue: { color: colors.primary, fontFamily: fonts.extraBold, fontSize: fontSize.display },
});
