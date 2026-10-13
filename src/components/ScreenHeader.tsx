import { StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";
import { fontSize, fontWeight, spacing } from "../constants/config";

type Props = {
  title: string;
  subtitle: string;
};

export default function ScreenHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.giant,
    paddingVertical: spacing.xl,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.xs + 1,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});