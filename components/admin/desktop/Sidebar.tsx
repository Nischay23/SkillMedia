import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { router, usePathname } from "expo-router";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser);

  const [collapsed, setCollapsed] = useState(false);
  const widthAnim = useRef(new Animated.Value(260)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: collapsed ? 72 : 260,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [collapsed, widthAnim]);

  const navItems = useMemo(
    () => [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "dashboard",
        route: "/admin",
        active: pathname === "/admin",
      },
      {
        id: "filters",
        label: "Filters",
        icon: "account-tree",
        route: "/admin/filters",
        active: pathname === "/admin/filters",
      },
      {
        id: "posts",
        label: "Posts",
        icon: "article",
        route: "/admin/posts",
        active: pathname?.startsWith("/admin/posts"),
      },
    ],
    [pathname]
  );

  return (
    <Animated.View
      style={[
        styles.container,
        { width: widthAnim },
        collapsed && styles.containerCollapsed,
      ]}
    >
      {/* Logo/Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <MaterialIcons
                name="admin-panel-settings"
                size={20}
                color="#fff"
              />
            </View>
            {!collapsed && (
              <Text style={styles.logoText}>
                SkillMedia
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setCollapsed((v) => !v)}
            style={styles.collapseButton}
            hitSlop={{
              top: 10,
              bottom: 10,
              left: 10,
              right: 10,
            }}
          >
            <MaterialIcons
              name={
                collapsed ? "chevron-right" : "chevron-left"
              }
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation */}
      <ScrollView
        style={styles.nav}
        showsVerticalScrollIndicator={false}
      >
        {!collapsed && (
          <Text style={styles.sectionLabel}>MENU</Text>
        )}
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.navItem,
              collapsed && styles.navItemCollapsed,
              item.active && styles.navItemActive,
            ]}
            onPress={() => router.push(item.route as any)}
          >
            <MaterialIcons
              name={item.icon as any}
              size={18}
              color={item.active ? "#E5E7EB" : "#9CA3AF"}
            />
            {!collapsed && (
              <Text
                style={[
                  styles.navText,
                  item.active && styles.navTextActive,
                ]}
              >
                {item.label}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottom}>
        {/* User Info */}
        {currentUser && !collapsed && (
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userInitials}>
                {(
                  currentUser.fullname?.[0] || "A"
                ).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text
                style={styles.userName}
                numberOfLines={1}
              >
                {currentUser.fullname ||
                  currentUser.username ||
                  "Admin"}
              </Text>
              <Text style={styles.userRole}>
                Administrator
              </Text>
            </View>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => signOut()}
        >
          <MaterialIcons
            name="logout"
            size={16}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111827",
    borderRightWidth: 1,
    borderRightColor: "#1F2937",
    flexDirection: "column",
  },
  containerCollapsed: {
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E5E7EB",
    letterSpacing: 0.5,
  },
  collapseButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1f2937",
    borderWidth: 1,
    borderColor: "#2d3748",
  },
  nav: {
    flex: 1,
    paddingHorizontal: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    letterSpacing: 1,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 2,
    borderRadius: 6,
  },
  navItemCollapsed: {
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  navItemActive: {
    backgroundColor: "#1F2937",
  },
  navText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  navTextActive: {
    color: "#E5E7EB",
    fontWeight: "600",
  },
  bottom: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  userInitials: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E5E7EB",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#E5E7EB",
  },
  userRole: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "transparent",
    opacity: 0.7,
  },
});
