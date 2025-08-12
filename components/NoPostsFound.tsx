// app/components/NoPostsFound.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Ensure @expo/vector-icons is installed
import { COLORS } from "@/constants/theme"; // Import your colors

interface NoPostsFoundProps {
  message: string;
  onOpenFilter: () => void;
}

export const NoPostsFound = ({
  message,
  onOpenFilter,
}: NoPostsFoundProps) => (
  <View style={styles.container}>
    <Ionicons
      name="alert-circle-outline"
      size={60}
      color={COLORS.primary}
      style={styles.icon}
    />
    <Text style={styles.messageText}>{message}</Text>
    <TouchableOpacity
      onPress={onOpenFilter}
      style={styles.button}
    >
      <Ionicons
        name="options-outline"
        size={20}
        color={COLORS.white}
      />
      <Text style={styles.buttonText}>Adjust Filters</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Use your app's main background color
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  icon: {
    marginBottom: 20,
  },
  messageText: {
    fontSize: 18,
    color: COLORS.gray, // A soft color for informative text
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 25,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accent, // A distinct color for the button
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    elevation: 5, // Android shadow
    shadowColor: COLORS.black, // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: {
    color: COLORS.white, // Button text should be white
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
