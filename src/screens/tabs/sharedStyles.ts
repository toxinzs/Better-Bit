import { StyleSheet } from "react-native";
import { colors, fonts, fontSize, spacing } from "../../theme";

export const tabStyles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    marginBottom: spacing.sm + 2,
  },
  logLine: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    lineHeight: 19,
    marginBottom: 4,
  },
});
