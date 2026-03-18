import { Ionicons } from "@expo/vector-icons";
import React, {
  useCallback,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  StatusBar,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";

import { Typography } from "@/components/ui/Typography";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";
import { useMutation, useQuery } from "convex/react";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const groupId = id as Id<"groups">;
  const group = useQuery(api.groups.getGroupById, {
    groupId,
  });
  const members = useQuery(api.groups.getGroupMembers, {
    groupId,
  });
  const leaveGroupMutation = useMutation(
    api.groups.leaveGroup,
  );

  // Menu sheet
  const menuRef = useRef<BottomSheet>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLeave = useCallback(() => {
    menuRef.current?.close();
    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            await leaveGroupMutation({ groupId });
            router.back();
          },
        },
      ],
    );
  }, [groupId, leaveGroupMutation, router]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    [],
  );

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      gap: 12,
    },
    headerCenter: {
      flex: 1,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.colors.surface,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    menuButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.colors.surface,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    placeholder: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 12,
    },
    membersBar: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      gap: 8,
    },
    avatarStack: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
    },
    memberAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: t.colors.background,
    },
    memberAvatarFallback: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: t.colors.background,
      backgroundColor: t.colors.primary + "20",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    // Menu sheet
    sheetBg: {
      backgroundColor: t.colors.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    sheetHandle: {
      backgroundColor: t.colors.textMuted,
      width: 36,
      height: 4,
    },
    menuItem: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
  }));

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={
            isDark ? "light-content" : "dark-content"
          }
        />
        <View style={styles.placeholder}>
          <Typography variant="body" color="textMuted">
            Loading...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  const displayMembers = (members ?? []).slice(0, 5);
  const extraCount = Math.max(
    0,
    (members?.length ?? 0) - 5,
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={theme.colors.text}
          />
        </Pressable>

        <View style={styles.headerCenter}>
          <Typography
            variant="h4"
            weight="bold"
            color="text"
            numberOfLines={1}
          >
            {group.name}
          </Typography>
          <Typography variant="caption" color="textMuted">
            {group.memberCount.toLocaleString()} members
          </Typography>
        </View>

        <Pressable
          onPress={() => {
            setMenuOpen(true);
            setTimeout(
              () => menuRef.current?.snapToIndex(0),
              100,
            );
          }}
          style={styles.menuButton}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={18}
            color={theme.colors.text}
          />
        </Pressable>
      </View>

      {/* Placeholder Body */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={styles.placeholder}
      >
        <Ionicons
          name="chatbubbles-outline"
          size={56}
          color={theme.colors.primary}
        />
        <Typography
          variant="h3"
          weight="bold"
          color="text"
          align="center"
        >
          Chat Coming Soon
        </Typography>
        <Typography
          variant="body"
          color="textMuted"
          align="center"
          style={{ maxWidth: 280 }}
        >
          Full messaging will be available in the next
          update
        </Typography>
      </Animated.View>

      {/* Members Preview Bar */}
      {displayMembers.length > 0 && (
        <Pressable
          onPress={() =>
            router.push(`/group/${id}/members` as any)
          }
          style={styles.membersBar}
        >
          <View style={styles.avatarStack}>
            {displayMembers.map(
              (member: any, index: number) =>
                member.profileImage ? (
                  <Image
                    key={member._id}
                    source={{ uri: member.profileImage }}
                    style={[
                      styles.memberAvatar,
                      index > 0 && { marginLeft: -8 },
                    ]}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    key={member._id}
                    style={[
                      styles.memberAvatarFallback,
                      index > 0 && { marginLeft: -8 },
                    ]}
                  >
                    <Ionicons
                      name="person"
                      size={14}
                      color={theme.colors.primary}
                    />
                  </View>
                ),
            )}
          </View>
          {extraCount > 0 && (
            <Typography
              variant="caption"
              weight="semibold"
              color="primary"
            >
              +{extraCount} more
            </Typography>
          )}
          <Typography variant="caption" color="textMuted">
            {group.memberCount} members in this group
          </Typography>
        </Pressable>
      )}

      {/* Menu Bottom Sheet */}
      {menuOpen && (
        <BottomSheet
          ref={menuRef}
          index={0}
          snapPoints={["30%"]}
          enablePanDownToClose
          enableDynamicSizing={false}
          onChange={(i) => {
            if (i === -1) setMenuOpen(false);
          }}
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.sheetBg}
          handleIndicatorStyle={styles.sheetHandle}
        >
          <BottomSheetView>
            <Pressable
              onPress={() => {
                menuRef.current?.close();
                router.push(`/group/${id}/members` as any);
              }}
              style={styles.menuItem}
            >
              <Ionicons
                name="people-outline"
                size={20}
                color={theme.colors.text}
              />
              <Typography variant="body" color="text">
                View Members
              </Typography>
            </Pressable>
            <Pressable
              onPress={() => {
                menuRef.current?.close();
                router.push(`/group/${id}/info` as any);
              }}
              style={styles.menuItem}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={theme.colors.text}
              />
              <Typography variant="body" color="text">
                Group Info
              </Typography>
            </Pressable>
            <Pressable
              onPress={handleLeave}
              style={styles.menuItem}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#EF4444"
              />
              <Typography
                variant="body"
                style={{ color: "#EF4444" }}
              >
                Leave Group
              </Typography>
            </Pressable>
          </BottomSheetView>
        </BottomSheet>
      )}
    </SafeAreaView>
  );
}
