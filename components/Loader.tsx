// app/components/Loader.tsx
import React from "react";
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
} from "react-native";
import { COLORS } from "@/constants/theme"; // Import your colors

export const Loader = () => (
  <View style={styles.container}>
    <ActivityIndicator
      size="large"
      color={COLORS.primary}
    />
    <Text style={styles.text}>
      Loading opportunities...
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background, // Use your app's background color
  },
  text: {
    marginTop: 10,
    color: COLORS.gray, // A readable color for loading text
    fontSize: 16,
  },
});
