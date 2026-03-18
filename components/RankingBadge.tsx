import React from "react";
import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useThemedStyles } from "@/providers/ThemeProvider";

interface RankingBadgeProps {
  ranking: number;
}

export default function RankingBadge({ ranking }: RankingBadgeProps) {
  const styles = useThemedStyles((t) => ({
    container: {
      borderRadius: t.borderRadius.lg,
      overflow: "hidden" as const,
    },
    gradient: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    text: {
      fontFamily: t.typography.fontFamily.bold,
      fontSize: t.typography.size.sm,
      color: "#FFFFFF",
    },
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#6C5DD3", "#8676FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.text}>#{ranking}</Text>
      </LinearGradient>
    </View>
  );
}
