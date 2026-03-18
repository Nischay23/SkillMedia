import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Dimensions,
  DimensionValue,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SKELETON_WIDTHS = [
  "60%",
  "45%",
  "70%",
  "40%",
  "65%",
  "50%",
];

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type Message = {
  _id: Id<"messages">;
  groupId: Id<"groups">;
  userId: Id<"users">;
  content: string;
  type: "text" | "announcement";
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: number;
  sender: {
    _id: Id<"users">;
    fullname: string;
    username: string;
    profileImage?: string;
    isAdmin: boolean;
  } | null;
};

// ─────────────────────────────────────────────────────────────
// SKELETON MESSAGE
// ─────────────────────────────────────────────────────────────
function SkeletonMessage({
  isRight,
  index,
}: {
  isRight: boolean;
  index: number;
}) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.25, { duration: 700 }),
      -1,
      true,
    );
  }, [opacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(180).delay(index * 60)}
      style={{
        alignSelf: isRight ? "flex-end" : "flex-start",
        flexDirection: "row",
        alignItems: "flex-end",
        marginBottom: 8,
        paddingHorizontal: 12,
      }}
    >
      {!isRight && (
        <Animated.View
          style={[
            {
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: theme.colors.surface,
              marginRight: 8,
            },
            pulseStyle,
          ]}
        />
      )}
      <Animated.View
        style={[
          {
            width:
              SKELETON_WIDTHS[
                index % SKELETON_WIDTHS.length
              ] as DimensionValue,
            height: 44,
            borderRadius: 18,
            backgroundColor: theme.colors.surface,
          },
          pulseStyle,
        ]}
      />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// DATE SEPARATOR
// ─────────────────────────────────────────────────────────────
function DateSeparator({ date }: { date: string }) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 16,
        paddingHorizontal: 20,
      }}
    >
      <View
        style={{
          flex: 1,
          height: 1,
          backgroundColor: theme.colors.border,
        }}
      />
      <Typography
        variant="caption"
        color="textMuted"
        style={{ marginHorizontal: 12 }}
      >
        {date}
      </Typography>
      <View
        style={{
          flex: 1,
          height: 1,
          backgroundColor: theme.colors.border,
        }}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// MESSAGE BUBBLE
// ─────────────────────────────────────────────────────────────
function MessageBubble({
  message,
  isOwn,
  showAvatar: _showAvatar,
  showName,
  showTimestamp,
  isFirstInGroup,
  isLastInGroup,
  onLongPress,
}: {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showName: boolean;
  showTimestamp: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  onLongPress: () => void;
}) {
  const { theme } = useTheme();

  // Deleted message
  if (message.isDeleted) {
    return (
      <View
        style={{
          alignSelf: isOwn ? "flex-end" : "flex-start",
          paddingHorizontal: 12,
          marginBottom: showTimestamp ? 4 : 2,
          marginLeft: !isOwn ? 42 : 0,
        }}
      >
        <Typography
          variant="body"
          style={{
            color: theme.colors.textMuted,
            fontStyle: "italic",
            fontSize: 13,
          }}
        >
          [Message deleted]
        </Typography>
      </View>
    );
  }

  // Announcement message (full width)
  if (message.type === "announcement") {
    return (
      <Animated.View
        entering={FadeIn.duration(180)}
        style={{
          marginHorizontal: 12,
          marginVertical: 6,
          backgroundColor: "rgba(245, 158, 11, 0.08)",
          borderLeftWidth: 3,
          borderLeftColor: "#F59E0B",
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
          }}
        >
          <Ionicons
            name="megaphone-outline"
            size={13}
            color="#F59E0B"
          />
          <Typography
            variant="caption"
            weight="semibold"
            style={{ color: "#F59E0B" }}
          >
            Announcement
          </Typography>
        </View>
        <Typography
          variant="body"
          color="text"
          style={{ fontSize: 15, lineHeight: 22 }}
        >
          {message.content}
        </Typography>
        {showTimestamp && (
          <Typography
            variant="caption"
            color="textMuted"
            style={{ fontSize: 10, marginTop: 6 }}
          >
            {formatTime(message.createdAt)}
          </Typography>
        )}
      </Animated.View>
    );
  }

  // Regular text message
  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={400}
    >
      <Animated.View
        entering={FadeIn.duration(180)}
        style={{
          alignSelf: isOwn ? "flex-end" : "flex-start",
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 8,
          marginBottom: showTimestamp ? 4 : 2,
          paddingHorizontal: 12,
        }}
      >
        {/* Avatar area for other users */}
        {!isOwn && (
          <View style={{ width: 34 }}>
            {isLastInGroup &&
              message.sender &&
              (message.sender.profileImage ? (
                <Image
                  source={{
                    uri: message.sender.profileImage,
                  }}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                  }}
                  contentFit="cover"
                />
              ) : (
                <LinearGradient
                  colors={["#6C5DD3", "#8676FF"]}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="caption"
                    weight="bold"
                    style={{ color: "#FFFFFF" }}
                  >
                    {message.sender.fullname[0]?.toUpperCase() ??
                      "?"}
                  </Typography>
                </LinearGradient>
              ))}
          </View>
        )}

        <View style={{ maxWidth: SCREEN_WIDTH * 0.72 }}>
          {/* Sender name */}
          {!isOwn && showName && message.sender && (
            <Typography
              variant="caption"
              color="textMuted"
              style={{ marginBottom: 2, marginLeft: 0 }}
            >
              {message.sender.fullname}
            </Typography>
          )}

          {/* Message bubble */}
          {isOwn ? (
            <LinearGradient
              colors={["#6C5DD3", "#8676FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 18,
                borderTopRightRadius: isFirstInGroup
                  ? 4
                  : 18,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Typography
                variant="body"
                style={{
                  color: "#FFFFFF",
                  fontSize: 15,
                  lineHeight: 22,
                }}
              >
                {message.content}
              </Typography>
            </LinearGradient>
          ) : (
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 18,
                borderTopLeftRadius: isFirstInGroup
                  ? 4
                  : 18,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Typography
                variant="body"
                color="text"
                style={{ fontSize: 15, lineHeight: 22 }}
              >
                {message.content}
              </Typography>
            </View>
          )}

          {/* Timestamp */}
          {showTimestamp && (
            <Typography
              variant="caption"
              color="textMuted"
              style={{
                fontSize: 10,
                marginTop: 4,
                alignSelf: isOwn
                  ? "flex-end"
                  : "flex-start",
                marginLeft: isOwn ? 0 : 42,
              }}
            >
              {formatTime(message.createdAt)}
            </Typography>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString())
    return "Today";
  if (date.toDateString() === yesterday.toDateString())
    return "Yesterday";
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function isSameDay(ts1: number, ts2: number): boolean {
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return d1.toDateString() === d2.toDateString();
}

function shouldGroupMessages(
  msg1: Message,
  msg2: Message,
): boolean {
  if (msg1.userId !== msg2.userId) return false;
  if (
    msg1.type === "announcement" ||
    msg2.type === "announcement"
  )
    return false;
  const timeDiff = Math.abs(
    msg1.createdAt - msg2.createdAt,
  );
  return timeDiff < 5 * 60 * 1000;
}

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const groupId = id as Id<"groups">;

  // Queries
  const currentUser = useQuery(api.users.getCurrentUser);
  const group = useQuery(api.groups.getGroupById, {
    groupId,
  });
  const messages = useQuery(api.messages.getMessages, {
    groupId,
  });
  const pinnedMessage = useQuery(
    api.messages.getPinnedMessage,
    { groupId },
  );

  // Mutations
  const sendMessageMutation = useMutation(
    api.messages.sendMessage,
  );
  const deleteMessageMutation = useMutation(
    api.messages.deleteMessage,
  );
  const pinMessageMutation = useMutation(
    api.messages.pinMessage,
  );
  const leaveGroupMutation = useMutation(
    api.groups.leaveGroup,
  );

  // State
  const [inputText, setInputText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionMessageId, setActionMessageId] =
    useState<Id<"messages"> | null>(null);
  const [announcementOpen, setAnnouncementOpen] =
    useState(false);
  const [announcementText, setAnnouncementText] =
    useState("");
  const [pinnedExpanded, setPinnedExpanded] =
    useState(false);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const menuRef = useRef<BottomSheet>(null);
  const actionRef = useRef<BottomSheet>(null);
  const announcementRef = useRef<BottomSheet>(null);
  const pinnedRef = useRef<BottomSheet>(null);
  const prevMessageCount = useRef<number>(0);

  // Animation values
  const sendScale = useSharedValue(1);
  const backScale = useSharedValue(1);
  const menuScale = useSharedValue(1);
  const announceBtnScale = useSharedValue(1);

  // Derived
  const isAdmin =
    currentUser?.isAdmin ||
    group?.currentUserRole === "admin";
  const canSend = inputText.trim().length > 0;

  // Auto-scroll on new messages
  useEffect(() => {
    if (
      messages &&
      messages.length > prevMessageCount.current
    ) {
      setTimeout(
        () =>
          flatListRef.current?.scrollToEnd({
            animated: true,
          }),
        100,
      );
    }
    if (messages)
      prevMessageCount.current = messages.length;
  }, [messages]);

  // Initial scroll to bottom
  const messagesLoaded = messages !== undefined;
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(
        () =>
          flatListRef.current?.scrollToEnd({
            animated: false,
          }),
        300,
      );
    }
  }, [messagesLoaded, messages]);

  // Handlers
  const handleSend = useCallback(async () => {
    if (!canSend) return;
    const text = inputText.trim();
    setInputText("");
    sendScale.value = withSpring(0.85, {
      damping: 12,
      stiffness: 300,
    });
    setTimeout(() => {
      sendScale.value = withSpring(1, {
        damping: 12,
        stiffness: 300,
      });
    }, 100);

    try {
      await sendMessageMutation({
        groupId,
        content: text,
        type: "text",
      });
    } catch {
      Alert.alert("Error", "Failed to send message");
      setInputText(text);
    }
  }, [
    inputText,
    canSend,
    groupId,
    sendMessageMutation,
    sendScale,
  ]);

  const handleSendAnnouncement = useCallback(async () => {
    if (!announcementText.trim()) return;
    const text = announcementText.trim();
    setAnnouncementText("");
    announcementRef.current?.close();

    try {
      await sendMessageMutation({
        groupId,
        content: text,
        type: "announcement",
      });
    } catch {
      Alert.alert("Error", "Failed to send announcement");
    }
  }, [announcementText, groupId, sendMessageMutation]);

  const handleDeleteMessage = useCallback(async () => {
    if (!actionMessageId) return;
    actionRef.current?.close();
    try {
      await deleteMessageMutation({
        messageId: actionMessageId,
      });
    } catch {
      Alert.alert("Error", "Failed to delete message");
    }
    setActionMessageId(null);
  }, [actionMessageId, deleteMessageMutation]);

  const handlePinMessage = useCallback(async () => {
    if (!actionMessageId) return;
    actionRef.current?.close();
    try {
      await pinMessageMutation({
        messageId: actionMessageId,
      });
    } catch {
      Alert.alert("Error", "Failed to pin message");
    }
    setActionMessageId(null);
  }, [actionMessageId, pinMessageMutation]);

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

  const handleMessageLongPress = useCallback(
    (message: Message) => {
      setActionMessageId(message._id);
      setTimeout(
        () => actionRef.current?.snapToIndex(0),
        100,
      );
    },
    [],
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  // Animated styles
  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));
  const backButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));
  const menuButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: menuScale.value }],
  }));
  const announceBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: announceBtnScale.value }],
  }));

  // Styles
  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      backgroundColor: t.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 10,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        },
        android: { elevation: 3 },
      }),
    },
    headerButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.08)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    headerCenter: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginHorizontal: 10,
      gap: 10,
    },
    headerAccent: {
      height: 1.5,
    },
    pinnedBanner: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginHorizontal: 12,
      marginTop: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: "rgba(160, 166, 255, 0.08)",
      borderLeftWidth: 3,
      borderLeftColor: t.colors.primary,
      borderRadius: 12,
      gap: 6,
    },
    messagesList: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingBottom: 100,
    },
    inputContainer: {
      flexDirection: "row" as const,
      alignItems: "flex-end" as const,
      backgroundColor: t.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      paddingBottom: insets.bottom + 8,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      gap: 8,
    },
    textInputWrapper: {
      flex: 1,
      borderRadius: 24,
      backgroundColor: "rgba(255,255,255,0.06)",
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingHorizontal: 16,
      paddingVertical: 8,
      minHeight: 40,
    },
    textInput: {
      fontSize: 15,
      color: t.colors.text,
      maxHeight: 100,
      lineHeight: 20,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    announcementButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.06)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    sheetBg: {
      backgroundColor: "#1E1E1E",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    sheetHandle: {
      backgroundColor: "#555",
      width: 40,
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
    announcementInput: {
      backgroundColor: "rgba(255,255,255,0.06)",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 15,
      color: t.colors.text,
      minHeight: 100,
      textAlignVertical: "top" as const,
    },
    announcementSubmit: {
      height: 50,
      borderRadius: 16,
      overflow: "hidden" as const,
      marginTop: 16,
    },
    announcementGradient: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
    },
  }));

  // Process messages for rendering
  const processedMessages = useMemo(() => {
    if (!messages || !currentUser) return [];

    const result: (
      | { type: "date"; date: string; key: string }
      | {
          type: "message";
          message: Message;
          isOwn: boolean;
          showAvatar: boolean;
          showName: boolean;
          showTimestamp: boolean;
          isFirstInGroup: boolean;
          isLastInGroup: boolean;
          key: string;
        }
    )[] = [];

    let lastDate: string | null = null;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const prevMsg = i > 0 ? messages[i - 1] : null;
      const nextMsg =
        i < messages.length - 1 ? messages[i + 1] : null;

      const dateLabel = formatDateLabel(msg.createdAt);
      if (dateLabel !== lastDate) {
        result.push({
          type: "date",
          date: dateLabel,
          key: `date-${msg.createdAt}`,
        });
        lastDate = dateLabel;
      }

      const isOwn = msg.userId === currentUser._id;
      const isFirstInGroup =
        !prevMsg ||
        !shouldGroupMessages(prevMsg, msg) ||
        !isSameDay(prevMsg.createdAt, msg.createdAt);
      const isLastInGroup =
        !nextMsg ||
        !shouldGroupMessages(msg, nextMsg) ||
        !isSameDay(msg.createdAt, nextMsg.createdAt);

      result.push({
        type: "message",
        message: msg,
        isOwn,
        showAvatar: !isOwn && isLastInGroup,
        showName: !isOwn && isFirstInGroup,
        showTimestamp: isLastInGroup,
        isFirstInGroup,
        isLastInGroup,
        key: msg._id,
      });
    }

    return result;
  }, [messages, currentUser]);

  // Loading state
  if (!group || !currentUser) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.headerButton}
          >
            <Ionicons
              name="arrow-back"
              size={18}
              color={theme.colors.text}
            />
          </Pressable>
          <View style={styles.headerCenter}>
            <View
              style={{
                width: 100,
                height: 14,
                backgroundColor: theme.colors.border,
                borderRadius: 7,
              }}
            />
          </View>
          <View style={{ width: 36 }} />
        </View>
        <LinearGradient
          colors={["#6C5DD3", "#8676FF", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerAccent}
        />
        <View style={{ flex: 1, paddingTop: 20 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonMessage
              key={i}
              isRight={i % 2 === 0}
              index={i}
            />
          ))}
        </View>
      </View>
    );
  }

  // Empty state renderer
  const renderEmpty = () => (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={styles.emptyContainer}
    >
      <Ionicons
        name="chatbubbles-outline"
        size={56}
        color={theme.colors.primary + "66"}
      />
      <Typography
        variant="h4"
        weight="bold"
        color="text"
        style={{ marginTop: 16, fontSize: 18 }}
      >
        No messages yet
      </Typography>
      <Typography
        variant="body"
        color="textMuted"
        align="center"
        style={{ marginTop: 6, fontSize: 14 }}
      >
        Be the first to say something!
      </Typography>
    </Animated.View>
  );

  const selectedMessage = actionMessageId
    ? messages?.find((m) => m._id === actionMessageId)
    : null;
  const isSelectedOwn =
    selectedMessage?.userId === currentUser._id;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios" ? "padding" : "height"
      }
      keyboardVerticalOffset={0}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPressIn={() => {
            backScale.value = withSpring(0.9, {
              damping: 15,
            });
          }}
          onPressOut={() => {
            backScale.value = withSpring(1, {
              damping: 15,
            });
          }}
          onPress={() => router.back()}
        >
          <Animated.View
            style={[styles.headerButton, backButtonStyle]}
          >
            <Ionicons
              name="arrow-back"
              size={18}
              color={theme.colors.text}
            />
          </Animated.View>
        </Pressable>

        <View style={styles.headerCenter}>
          <LinearGradient
            colors={["#6C5DD3", "#8676FF"]}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="body"
              weight="bold"
              style={{ color: "#FFFFFF" }}
            >
              {(group.name || "G")[0].toUpperCase()}
            </Typography>
          </LinearGradient>
          <View>
            <Typography
              variant="body"
              weight="bold"
              color="text"
              numberOfLines={1}
              style={{ fontSize: 15 }}
            >
              {group.name}
            </Typography>
            <Typography
              variant="caption"
              color="textMuted"
              style={{ fontSize: 12 }}
            >
              {group.memberCount.toLocaleString()} members
            </Typography>
          </View>
        </View>

        <Pressable
          onPressIn={() => {
            menuScale.value = withSpring(0.9, {
              damping: 15,
            });
          }}
          onPressOut={() => {
            menuScale.value = withSpring(1, {
              damping: 15,
            });
          }}
          onPress={() => {
            if (Platform.OS === "android") {
              Alert.alert(group.name, undefined, [
                {
                  text: "View Members",
                  onPress: () =>
                    router.push(
                      `/group/${id}/members` as any,
                    ),
                },
                {
                  text: "Group Info",
                  onPress: () =>
                    router.push(`/group/${id}/info` as any),
                },
                {
                  text: "Leave Group",
                  style: "destructive",
                  onPress: () => {
                    Alert.alert(
                      "Leave Group",
                      "Are you sure you want to leave this group?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Leave",
                          style: "destructive",
                          onPress: async () => {
                            await leaveGroupMutation({
                              groupId,
                            });
                            router.back();
                          },
                        },
                      ],
                    );
                  },
                },
                { text: "Cancel", style: "cancel" },
              ]);
            } else {
              setMenuOpen(true);
              setTimeout(
                () => menuRef.current?.snapToIndex(0),
                100,
              );
            }
          }}
        >
          <Animated.View
            style={[styles.headerButton, menuButtonStyle]}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={theme.colors.text}
            />
          </Animated.View>
        </Pressable>
      </View>

      {/* Header accent line */}
      <LinearGradient
        colors={["#6C5DD3", "#8676FF", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerAccent}
      />

      {/* Pinned Banner */}
      {pinnedMessage && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <Pressable
            onPress={() => {
              setPinnedExpanded(true);
              setTimeout(
                () => pinnedRef.current?.snapToIndex(0),
                100,
              );
            }}
            style={styles.pinnedBanner}
          >
            <Ionicons
              name="pin"
              size={12}
              color={theme.colors.primary}
            />
            <Typography
              variant="caption"
              weight="semibold"
              color="primary"
            >
              Pinned
            </Typography>
            <Typography
              variant="body"
              color="textMuted"
              numberOfLines={1}
              style={{ flex: 1, fontSize: 13 }}
            >
              {pinnedMessage.content}
            </Typography>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={theme.colors.textMuted}
            />
          </Pressable>
        </Animated.View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={processedMessages}
        keyExtractor={(item) => item.key}
        style={styles.messagesList}
        contentContainerStyle={{
          paddingHorizontal: 0,
          paddingTop: 12,
          paddingBottom: 20,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          messages?.length === 0 ? renderEmpty : null
        }
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          if (item.type === "date")
            return <DateSeparator date={item.date} />;
          return (
            <MessageBubble
              message={item.message}
              isOwn={item.isOwn}
              showAvatar={item.showAvatar}
              showName={item.showName}
              showTimestamp={item.showTimestamp}
              isFirstInGroup={item.isFirstInGroup}
              isLastInGroup={item.isLastInGroup}
              onLongPress={() =>
                handleMessageLongPress(item.message)
              }
            />
          );
        }}
      />

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        {/* Admin announcement button */}
        {isAdmin && (
          <Pressable
            onPressIn={() => {
              announceBtnScale.value = withSpring(0.9, {
                damping: 15,
              });
            }}
            onPressOut={() => {
              announceBtnScale.value = withSpring(1, {
                damping: 15,
              });
            }}
            onPress={() => {
              setAnnouncementOpen(true);
              setTimeout(
                () =>
                  announcementRef.current?.snapToIndex(0),
                100,
              );
            }}
          >
            <Animated.View
              style={[
                styles.announcementButton,
                announceBtnStyle,
              ]}
            >
              <Ionicons
                name="megaphone-outline"
                size={18}
                color={theme.colors.primary}
              />
            </Animated.View>
          </Pressable>
        )}

        {/* Text input */}
        <View style={styles.textInputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Message..."
            placeholderTextColor={theme.colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
          />
        </View>

        {/* Send button */}
        <Animated.View style={sendButtonStyle}>
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            style={styles.sendButton}
          >
            {canSend ? (
              <LinearGradient
                colors={["#6C5DD3", "#8676FF"]}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  ...Platform.select({
                    ios: {
                      shadowColor: "#6C5DD3",
                      shadowOpacity: 0.4,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                    },
                  }),
                }}
              >
                <Ionicons
                  name="send"
                  size={17}
                  color="#FFFFFF"
                />
              </LinearGradient>
            ) : (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="send"
                  size={17}
                  color={theme.colors.textMuted}
                />
              </View>
            )}
          </Pressable>
        </Animated.View>
      </View>

      {/* Menu Bottom Sheet (iOS only) */}
      {menuOpen && Platform.OS === "ios" && (
        <BottomSheet
          ref={menuRef}
          index={0}
          snapPoints={["28%"]}
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
                color={theme.colors.primary}
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
                color={theme.colors.primary}
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
                name="exit-outline"
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

      {/* Message Action Sheet */}
      {actionMessageId && (
        <BottomSheet
          ref={actionRef}
          index={0}
          snapPoints={["22%"]}
          enablePanDownToClose
          enableDynamicSizing={false}
          onChange={(i) => {
            if (i === -1) setActionMessageId(null);
          }}
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.sheetBg}
          handleIndicatorStyle={styles.sheetHandle}
        >
          <BottomSheetView>
            {(isSelectedOwn || isAdmin) && (
              <Pressable
                onPress={handleDeleteMessage}
                style={styles.menuItem}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color="#EF4444"
                />
                <Typography
                  variant="body"
                  style={{ color: "#EF4444" }}
                >
                  Delete Message
                </Typography>
              </Pressable>
            )}
            {isAdmin && !isSelectedOwn && (
              <Pressable
                onPress={handlePinMessage}
                style={styles.menuItem}
              >
                <Ionicons
                  name="pin-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Typography variant="body" color="primary">
                  Pin Message
                </Typography>
              </Pressable>
            )}
            {!isSelectedOwn && !isAdmin && (
              <Pressable
                onPress={() => {
                  actionRef.current?.close();
                  Alert.alert(
                    "Coming Soon",
                    "Report feature coming soon!",
                  );
                }}
                style={styles.menuItem}
              >
                <Ionicons
                  name="flag-outline"
                  size={20}
                  color={theme.colors.textMuted}
                />
                <Typography
                  variant="body"
                  color="textMuted"
                >
                  Report
                </Typography>
              </Pressable>
            )}
          </BottomSheetView>
        </BottomSheet>
      )}

      {/* Announcement Bottom Sheet */}
      {announcementOpen && (
        <BottomSheet
          ref={announcementRef}
          index={0}
          snapPoints={["45%"]}
          enablePanDownToClose
          enableDynamicSizing={false}
          onChange={(i) => {
            if (i === -1) setAnnouncementOpen(false);
          }}
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.sheetBg}
          handleIndicatorStyle={styles.sheetHandle}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
        >
          <BottomSheetView
            style={{ paddingHorizontal: 20, paddingTop: 4 }}
          >
            <Typography
              variant="body"
              weight="bold"
              color="text"
              style={{ fontSize: 16 }}
            >
              Send Announcement
            </Typography>
            <Typography
              variant="caption"
              color="textMuted"
              style={{ marginBottom: 16 }}
            >
              Pinned and visible to all members
            </Typography>
            <BottomSheetTextInput
              style={styles.announcementInput}
              placeholder="Write your announcement..."
              placeholderTextColor={theme.colors.textMuted}
              value={announcementText}
              onChangeText={setAnnouncementText}
              multiline
            />
            <Pressable
              onPress={handleSendAnnouncement}
              disabled={!announcementText.trim()}
              style={[
                styles.announcementSubmit,
                !announcementText.trim() && {
                  opacity: 0.5,
                },
              ]}
            >
              <LinearGradient
                colors={["#6C5DD3", "#8676FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.announcementGradient}
              >
                <Ionicons
                  name="megaphone-outline"
                  size={16}
                  color="#FFFFFF"
                />
                <Typography
                  variant="body"
                  weight="bold"
                  style={{ color: "#FFFFFF" }}
                >
                  Send Announcement
                </Typography>
              </LinearGradient>
            </Pressable>
          </BottomSheetView>
        </BottomSheet>
      )}

      {/* Pinned Message Expanded */}
      {pinnedExpanded && pinnedMessage && (
        <BottomSheet
          ref={pinnedRef}
          index={0}
          snapPoints={["40%"]}
          enablePanDownToClose
          enableDynamicSizing={false}
          onChange={(i) => {
            if (i === -1) setPinnedExpanded(false);
          }}
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.sheetBg}
          handleIndicatorStyle={styles.sheetHandle}
        >
          <BottomSheetView
            style={{ paddingHorizontal: 20, paddingTop: 4 }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Ionicons
                name="pin"
                size={18}
                color={theme.colors.primary}
              />
              <Typography
                variant="body"
                weight="bold"
                color="text"
                style={{ fontSize: 16 }}
              >
                Pinned Message
              </Typography>
            </View>
            {pinnedMessage.sender && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {pinnedMessage.sender.profileImage ? (
                  <Image
                    source={{
                      uri: pinnedMessage.sender
                        .profileImage,
                    }}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                    }}
                    contentFit="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={["#6C5DD3", "#8676FF"]}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="person"
                      size={10}
                      color="#FFFFFF"
                    />
                  </LinearGradient>
                )}
                <Typography
                  variant="caption"
                  color="textMuted"
                >
                  {pinnedMessage.sender.fullname} •{" "}
                  {formatTime(pinnedMessage.createdAt)}
                </Typography>
              </View>
            )}
            <Typography
              variant="body"
              color="text"
              style={{ lineHeight: 22 }}
            >
              {pinnedMessage.content}
            </Typography>
          </BottomSheetView>
        </BottomSheet>
      )}
    </KeyboardAvoidingView>
  );
}
