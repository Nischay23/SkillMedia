// app/components/Loader.tsx
import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Typography } from "@/components/ui/Typography";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";

export const Loader = () => {
  const { theme } = useTheme();

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      backgroundColor: t.colors.background,
    },
  }));

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Typography
        variant="body"
        color="textMuted"
        style={{ marginTop: 10 }}
      >
        Loading opportunities...
      </Typography>
    </View>
  );
};
