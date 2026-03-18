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
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { useLocalSearchParams, useRouter } from "expo-router";

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
function SkeletonMessage({ isRight, index }: { isRight: boolean; index: number }) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800 }),
      -1,
      true
    );
  }, [opacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(200).delay(index * 50)}
      style={[
        {
          alignSelf: isRight ? "flex-end" : "flex-start",
          flexDirection: "row",
          alignItems: "flex-end",
          marginBottom: 8,
          paddingHorizontal: 12,
        },
      ]}
    >
      {!isRight && (
        <Animated.View
          style={[
            {
              width: 32,
              height: 32,
              borderRadius: 16,
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
            width: isRight ? 180 : 150,
            height: 44,
            borderRadius: 16,
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
  showAvatar,
  showName,
  showTimestamp,
  isFirstInGroup,
  onLongPress,
}: {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showName: boolean;
  showTimestamp: boolean;
  isFirstInGroup: boolean;
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
          marginLeft: !isOwn && !showAvatar ? 40 : 0,
        }}
      >
        <Typography
          variant="body"
          style={{
            color: theme.colors.textMuted,
            fontStyle: "italic",
            fontSize: 14,
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
        entering={FadeIn.duration(200)}
        style={{
          marginHorizontal: 8,
          marginBottom: showTimestamp ? 8 : 4,
          backgroundColor: "rgba(245, 158, 11, 0.12)",
          borderLeftWidth: 3,
          borderLeftColor: "#F59E0B",
          borderRadius: 12,
          padding: 12,
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
          <Ionicons name="megaphone-outline" size={14} color="#F59E0B" />
          <Typography
            variant="caption"
            weight="semibold"
            style={{ color: "#F59E0B" }}
          >
            Announcement
          </Typography>
        </View>
        <Typography variant="body" color="text" style={{ fontSize: 15 }}>
          {message.content}
        </Typography>
        {showTimestamp && (
          <Typography
            variant="caption"
            color="textMuted"
            style={{ fontSize: 11, marginTop: 6 }}
          >
            {formatTime(message.createdAt)}
          </Typography>
        )}
      </Animated.View>
    );
  }

  // Regular text message
  return (
    <Pressable onLongPress={onLongPress} delayLongPress={400}>
      <Animated.View
        entering={FadeIn.duration(200)}
        style={{
          alignSelf: isOwn ? "flex-end" : "flex-start",
          flexDirection: "row",
          alignItems: "flex-end",
          marginBottom: showTimestamp ? 8 : 2,
          paddingHorizontal: 12,
          maxWidth: "80%",
        }}
      >
        {/* Avatar for other users */}
        {!isOwn && showAvatar && message.sender && (
          message.sender.profileImage ? (
            <Image
              source={{ uri: message.sender.profileImage }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                marginRight: 8,
              }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                marginRight: 8,
                backgroundColor: theme.colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                weight="bold"
                style={{ color: theme.colors.primary }}
              >
                {message.sender.fullname[0]?.toUpperCase() ?? "?"}
              </Typography>
            </View>
          )
        )}

        {/* Spacer when no avatar but not own message */}
        {!isOwn && !showAvatar && <View style={{ width: 40 }} />}

        <View style={{ flex: 1 }}>
          {/* Sender name (only for first in group, other users) */}
          {!isOwn && showName && message.sender && (
            <Typography
              variant="caption"
              style={{
                color: message.sender.isAdmin
                  ? theme.colors.primary
                  : theme.colors.textMuted,
                marginBottom: 2,
                marginLeft: 4,
              }}
            >
              {message.sender.fullname}
              {message.sender.isAdmin && " · Admin"}
            </Typography>
          )}

          {/* Message bubble */}
          {isOwn ? (
            <LinearGradient
              colors={["#6C5DD3", "#8676FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                borderTopRightRadius: isFirstInGroup ? 4 : 16,
                paddingHorizontal: 14,
                paddingVertical: 10,
                alignSelf: "flex-end",
              }}
            >
              <Typography
                variant="body"
                style={{ color: "#FFFFFF", fontSize: 15 }}
              >
                {message.content}
              </Typography>
            </LinearGradient>
          ) : (
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 16,
                borderTopLeftRadius: isFirstInGroup ? 4 : 16,
                paddingHorizontal: 14,
                paddingVertical: 10,
                alignSelf: "flex-start",
              }}
            >
              <Typography
                variant="body"
                color="text"
                style={{ fontSize: 15 }}
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
                fontSize: 11,
                marginTop: 4,
                alignSelf: isOwn ? "flex-end" : "flex-start",
                marginHorizontal: 4,
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
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function isSameDay(ts1: number, ts2: number): boolean {
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return d1.toDateString() === d2.toDateString();
}

function shouldGroupMessages(msg1: Message, msg2: Message): boolean {
  // Same sender and within 5 minutes
  if (msg1.userId !== msg2.userId) return false;
  if (msg1.type === "announcement" || msg2.type === "announcement") return false;
  const timeDiff = Math.abs(msg1.createdAt - msg2.createdAt);
  return timeDiff < 5 * 60 * 1000;
}

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const groupId = id as Id<"groups">;

  // Queries
  const currentUser = useQuery(api.users.getCurrentUser);
  const group = useQuery(api.groups.getGroupById, { groupId });
  const messages = useQuery(api.messages.getMessages, { groupId });
  const pinnedMessage = useQuery(api.messages.getPinnedMessage, { groupId });

  // Mutations
  const sendMessageMutation = useMutation(api.messages.sendMessage);
  const deleteMessageMutation = useMutation(api.messages.deleteMessage);
  const pinMessageMutation = useMutation(api.messages.pinMessage);
  const leaveGroupMutation = useMutation(api.groups.leaveGroup);

  // State
  const [inputText, setInputText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionMessageId, setActionMessageId] = useState<Id<"messages"> | null>(null);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [pinnedExpanded, setPinnedExpanded] = useState(false);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const menuRef = useRef<BottomSheet>(null);
  const actionRef = useRef<BottomSheet>(null);
  const announcementRef = useRef<BottomSheet>(null);
  const pinnedRef = useRef<BottomSheet>(null);
  const prevMessageCount = useRef<number>(0);

  // Animation values
  const sendScale = useSharedValue(1);

  // Derived
  const isAdmin = currentUser?.isAdmin || group?.currentUserRole === "admin";
  const canSend = inputText.trim().length > 0;

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages && messages.length > prevMessageCount.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    if (messages) {
      prevMessageCount.current = messages.length;
    }
  }, [messages?.length]);

  // Initial scroll to bottom
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 300);
    }
  }, [messages !== undefined]);

  // Handlers
  const handleSend = useCallback(async () => {
    if (!canSend) return;
    const text = inputText.trim();
    setInputText("");
    sendScale.value = withSpring(0.88, { damping: 10, stiffness: 300 });
    setTimeout(() => {
      sendScale.value = withSpring(1, { damping: 10, stiffness: 300 });
    }, 100);

    try {
      await sendMessageMutation({ groupId, content: text, type: "text" });
    } catch (error) {
      Alert.alert("Error", "Failed to send message");
      setInputText(text);
    }
  }, [inputText, canSend, groupId, sendMessageMutation, sendScale]);

  const handleSendAnnouncement = useCallback(async () => {
    if (!announcementText.trim()) return;
    const text = announcementText.trim();
    setAnnouncementText("");
    announcementRef.current?.close();

    try {
      await sendMessageMutation({ groupId, content: text, type: "announcement" });
    } catch (error) {
      Alert.alert("Error", "Failed to send announcement");
    }
  }, [announcementText, groupId, sendMessageMutation]);

  const handleDeleteMessage = useCallback(async () => {
    if (!actionMessageId) return;
    actionRef.current?.close();
    try {
      await deleteMessageMutation({ messageId: actionMessageId });
    } catch (error) {
      Alert.alert("Error", "Failed to delete message");
    }
    setActionMessageId(null);
  }, [actionMessageId, deleteMessageMutation]);

  const handlePinMessage = useCallback(async () => {
    if (!actionMessageId) return;
    actionRef.current?.close();
    try {
      await pinMessageMutation({ messageId: actionMessageId });
    } catch (error) {
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
      ]
    );
  }, [groupId, leaveGroupMutation, router]);

  const handleMessageLongPress = useCallback(
    (message: Message) => {
      setActionMessageId(message._id);
      setTimeout(() => actionRef.current?.snapToIndex(0), 100);
    },
    []
  );

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
    []
  );

  // Animated styles
  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
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
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      gap: 10,
    },
    headerAccent: {
      height: 2,
      backgroundColor: t.colors.primary,
    },
    headerCenter: {
      flex: 1,
      alignItems: "center" as const,
    },
    headerButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.colors.surface,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    pinnedBanner: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginHorizontal: 12,
      marginTop: 8,
      padding: 10,
      backgroundColor: t.colors.primary + "1A",
      borderLeftWidth: 3,
      borderLeftColor: t.colors.primary,
      borderRadius: 8,
      gap: 8,
    },
    messagesList: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 12,
      paddingBottom: 100,
    },
    inputContainer: {
      flexDirection: "row" as const,
      alignItems: "flex-end" as const,
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: Math.max(insets.bottom, 8) + 70,
      backgroundColor: t.colors.background,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      gap: 8,
    },
    inputAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      marginBottom: 5,
    },
    inputAvatarFallback: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: t.colors.primary + "20",
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginBottom: 5,
    },
    textInput: {
      flex: 1,
      backgroundColor: t.colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      color: t.colors.text,
      maxHeight: 100,
    },
    sendButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginBottom: 1,
    },
    announcementButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: t.colors.surface,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginBottom: 1,
    },
    // Bottom sheet styles
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
    announcementInput: {
      backgroundColor: t.colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: t.colors.text,
      minHeight: 80,
      textAlignVertical: "top" as const,
    },
    announcementButton2: {
      height: 48,
      borderRadius: 12,
      overflow: "hidden" as const,
      marginTop: 12,
    },
    announcementGradient: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
  }));

  // Process messages for rendering with date separators and grouping
  const processedMessages = useMemo(() => {
    if (!messages || !currentUser) return [];

    const result: Array<
      | { type: "date"; date: string; key: string }
      | {
          type: "message";
          message: Message;
          isOwn: boolean;
          showAvatar: boolean;
          showName: boolean;
          showTimestamp: boolean;
          isFirstInGroup: boolean;
          key: string;
        }
    > = [];

    let lastDate: string | null = null;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const prevMsg = i > 0 ? messages[i - 1] : null;
      const nextMsg = i < messages.length - 1 ? messages[i + 1] : null;

      // Add date separator if needed
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
        showAvatar: !isOwn && isFirstInGroup,
        showName: !isOwn && isFirstInGroup,
        showTimestamp: isLastInGroup,
        isFirstInGroup,
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
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View
              style={{
                width: 120,
                height: 16,
                backgroundColor: theme.colors.surface,
                borderRadius: 8,
              }}
            />
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.headerAccent} />
        <View style={{ flex: 1, paddingTop: 20 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonMessage key={i} isRight={i % 2 === 0} index={i} />
          ))}
        </View>
      </View>
    );
  }

  // Empty state
  const renderEmpty = () => (
    <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
      <Ionicons
        name="chatbubbles-outline"
        size={56}
        color={theme.colors.primary + "66"}
      />
      <Typography variant="h4" weight="bold" color="text">
        No messages yet
      </Typography>
      <Typography variant="body" color="textMuted" align="center">
        Be the first to say something!
      </Typography>
    </Animated.View>
  );

  // Selected message for action sheet
  const selectedMessage = actionMessageId
    ? messages?.find((m) => m._id === actionMessageId)
    : null;
  const isSelectedOwn = selectedMessage?.userId === currentUser._id;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Typography variant="body" weight="bold" color="text" numberOfLines={1}>
            {group.name}
          </Typography>
          <Typography variant="caption" color="textMuted">
            {group.memberCount.toLocaleString()} members
          </Typography>
        </View>

        <Pressable
          onPress={() => {
            setMenuOpen(true);
            setTimeout(() => menuRef.current?.snapToIndex(0), 100);
          }}
          style={styles.headerButton}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.text} />
        </Pressable>
      </View>
      <View style={styles.headerAccent} />

      {/* Pinned Banner */}
      {pinnedMessage && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <Pressable
            onPress={() => {
              setPinnedExpanded(true);
              setTimeout(() => pinnedRef.current?.snapToIndex(0), 100);
            }}
            style={styles.pinnedBanner}
          >
            <Ionicons name="pin" size={14} color={theme.colors.primary} />
            <Typography
              variant="caption"
              weight="semibold"
              style={{ color: theme.colors.primary }}
            >
              Pinned
            </Typography>
            <Typography
              variant="body"
              color="text"
              numberOfLines={1}
              style={{ flex: 1, fontSize: 13 }}
            >
              {pinnedMessage.content}
            </Typography>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
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
          paddingTop: 12,
          paddingBottom: 20,
          flexGrow: 1,
        }}
        ListEmptyComponent={messages?.length === 0 ? renderEmpty : null}
        renderItem={({ item }) => {
          if (item.type === "date") {
            return <DateSeparator date={item.date} />;
          }
          return (
            <MessageBubble
              message={item.message}
              isOwn={item.isOwn}
              showAvatar={item.showAvatar}
              showName={item.showName}
              showTimestamp={item.showTimestamp}
              isFirstInGroup={item.isFirstInGroup}
              onLongPress={() => handleMessageLongPress(item.message)}
            />
          );
        }}
        onContentSizeChange={() => {
          // Scroll to end when content size changes
        }}
      />

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        {/* Admin announcement button */}
        {isAdmin && (
          <Pressable
            onPress={() => {
              setAnnouncementOpen(true);
              setTimeout(() => announcementRef.current?.snapToIndex(0), 100);
            }}
            style={styles.announcementButton}
          >
            <Ionicons
              name="megaphone-outline"
              size={20}
              color={theme.colors.textMuted}
            />
          </Pressable>
        )}

        {/* User avatar */}
        {currentUser.profileImage ? (
          <Image
            source={{ uri: currentUser.profileImage }}
            style={styles.inputAvatar}
            contentFit="cover"
          />
        ) : (
          <View style={styles.inputAvatarFallback}>
            <Ionicons name="person" size={14} color={theme.colors.primary} />
          </View>
        )}

        {/* Text input */}
        <TextInput
          style={styles.textInput}
          placeholder="Message..."
          placeholderTextColor={theme.colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={2000}
        />

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
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </LinearGradient>
            ) : (
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: theme.colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.4,
                }}
              >
                <Ionicons name="send" size={16} color={theme.colors.textMuted} />
              </View>
            )}
          </Pressable>
        </Animated.View>
      </View>

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
              <Ionicons name="people-outline" size={20} color={theme.colors.text} />
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
            <Pressable onPress={handleLeave} style={styles.menuItem}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Typography variant="body" style={{ color: "#EF4444" }}>
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
          snapPoints={["25%"]}
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
            {/* Delete option (own message or admin) */}
            {(isSelectedOwn || isAdmin) && (
              <Pressable onPress={handleDeleteMessage} style={styles.menuItem}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Typography variant="body" style={{ color: "#EF4444" }}>
                  Delete Message
                </Typography>
              </Pressable>
            )}
            {/* Pin option (admin only) */}
            {isAdmin && !isSelectedOwn && (
              <Pressable onPress={handlePinMessage} style={styles.menuItem}>
                <Ionicons name="pin-outline" size={20} color={theme.colors.primary} />
                <Typography variant="body" color="primary">
                  Pin Message
                </Typography>
              </Pressable>
            )}
            {/* Report option (others' messages) */}
            {!isSelectedOwn && !isAdmin && (
              <Pressable
                onPress={() => {
                  actionRef.current?.close();
                  Alert.alert("Coming Soon", "Report feature coming soon!");
                }}
                style={styles.menuItem}
              >
                <Ionicons name="flag-outline" size={20} color={theme.colors.text} />
                <Typography variant="body" color="text">
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
          <BottomSheetView style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <Ionicons name="megaphone-outline" size={20} color="#F59E0B" />
              <Typography variant="h4" weight="bold" color="text">
                Send Announcement
              </Typography>
            </View>
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
                styles.announcementButton2,
                !announcementText.trim() && { opacity: 0.5 },
              ]}
            >
              <LinearGradient
                colors={["#F59E0B", "#FBBF24"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.announcementGradient}
              >
                <Typography variant="body" weight="bold" style={{ color: "#FFFFFF" }}>
                  Send Announcement
                </Typography>
              </LinearGradient>
            </Pressable>
          </BottomSheetView>
        </BottomSheet>
      )}

      {/* Pinned Message Expanded Bottom Sheet */}
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
          <BottomSheetView style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Ionicons name="pin" size={18} color={theme.colors.primary} />
              <Typography variant="h4" weight="bold" color="text">
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
                    source={{ uri: pinnedMessage.sender.profileImage }}
                    style={{ width: 24, height: 24, borderRadius: 12 }}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: theme.colors.primary + "20",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="person" size={12} color={theme.colors.primary} />
                  </View>
                )}
                <Typography variant="caption" color="textMuted">
                  {pinnedMessage.sender.fullname} • {formatTime(pinnedMessage.createdAt)}
                </Typography>
              </View>
            )}
            <Typography variant="body" color="text" style={{ lineHeight: 22 }}>
              {pinnedMessage.content}
            </Typography>
          </BottomSheetView>
        </BottomSheet>
      )}
    </KeyboardAvoidingView>
  );
}
