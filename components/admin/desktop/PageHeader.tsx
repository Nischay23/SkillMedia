import { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  style?: ViewStyle;
}

export default function PageHeader({
  title,
  description,
  action,
  style,
}: PageHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {description && (
          <Text style={styles.description}>
            {description}
          </Text>
        )}
      </View>
      {action && (
        <View style={styles.actionContainer}>{action}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#E5E7EB",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  actionContainer: {
    marginLeft: 24,
  },
});
