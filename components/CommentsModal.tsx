import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDistanceToNow } from "date-fns";

import { Typography } from "@/components/ui/Typography";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-expo";

// ── Colors ──────────────────────────────────────────────
const C = {
  bg: "#262626",
  surface: "#363636",
  inputBg: "#363636",
  border: "#3D3D3D",
  text: "#FFFFFF",
  textSecondary: "#A8A8A8",
  textMuted: "#737373",
  primary: "#3897F0",
  likePink: "#ED4956",
  handle: "#5E5E5E",
};

// ── Comment Item ────────────────────────────────────────
function CommentItem({
  comment,
  index,
  onReply,
}: {
  comment: any;
  index: number;
  onReply: (username: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const timeAgo = comment.createdAt
    ? formatDistanceToNow(comment.createdAt, {
        addSuffix: false,
      })
    : "";

  // Shorten timeAgo: "about 2 hours" → "2h", "3 days" → "3d", "15 minutes" → "15m"
  const shortTime = timeAgo
    .replace("about ", "")
    .replace("less than a minute", "now")
    .replace(/(\d+)\s*seconds?/, "$1s")
    .replace(/(\d+)\s*minutes?/, "$1m")
    .replace(/(\d+)\s*hours?/, "$1h")
    .replace(/(\d+)\s*days?/, "$1d")
    .replace(/(\d+)\s*weeks?/, "$1w")
    .replace(/(\d+)\s*months?/, "$1mo")
    .replace(/(\d+)\s*years?/, "$1y");

  const username =
    comment.user?.username ||
    comment.user?.fullname ||
    "user";

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(
        Math.min(index * 50, 400),
      )}
    >
      <View style={s.commentRow}>
        {/* Avatar */}
        {comment.user?.profileImage ? (
          <Image
            source={{ uri: comment.user.profileImage }}
            style={s.commentAvatar}
            contentFit="cover"
          />
        ) : (
          <View style={s.commentAvatarFallback}>
            <Ionicons
              name="person"
              size={16}
              color={C.textMuted}
            />
          </View>
        )}

        {/* Body */}
        <View style={s.commentBody}>
          <Typography
            variant="body"
            style={s.commentContent}
          >
            <Typography
              variant="body"
              weight="bold"
              style={{ color: C.text }}
            >
              {username}
            </Typography>
            {"  "}
            {comment.content}
          </Typography>

          {/* Meta row: time, likes, reply */}
          <View style={s.commentMeta}>
            <Typography
              variant="caption"
              style={{ color: C.textMuted }}
            >
              {shortTime}
            </Typography>
            {liked && (
              <Typography
                variant="caption"
                weight="semibold"
                style={{ color: C.textMuted }}
              >
                1 like
              </Typography>
            )}
            <Pressable onPress={() => onReply(username)}>
              <Typography
                variant="caption"
                weight="semibold"
                style={{ color: C.textMuted }}
              >
                Reply
              </Typography>
            </Pressable>
          </View>
        </View>

        {/* Like button */}
        <Pressable
          onPress={() => setLiked(!liked)}
          hitSlop={10}
          style={s.commentLikeBtn}
        >
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={12}
            color={liked ? C.likePink : C.textMuted}
          />
        </Pressable>
      </View>
      <View style={s.commentSeparator} />
    </Animated.View>
  );
}

// ── Props ───────────────────────────────────────────────
type CommentsModalProps = {
  communityPostId: Id<"communityPosts">;
  visible: boolean;
  onClose: () => void;
};

// ── Component ───────────────────────────────────────────
export default function CommentsModal({
  communityPostId,
  visible,
  onClose,
}: CommentsModalProps) {
  const { user: clerkUser } = useUser();
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const inputRef = useRef<any>(null);

  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<
    string | null
  >(null);

  const comments = useQuery(api.comments.getComments, {
    communityPostId,
  });
  const addComment = useMutation(api.comments.addComment);

  // 50% → 90% snap points (half-screen → near full-screen)
  const snapPoints = useMemo(() => ["55%", "92%"], []);

  // Open/close based on visible prop
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
        setReplyingTo(null);
        Keyboard.dismiss();
      }
    },
    [onClose],
  );

  const handleReply = useCallback((username: string) => {
    setReplyingTo(username);
    setNewComment(`@${username} `);
    inputRef.current?.focus();
  }, []);

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim()) return;
    try {
      await addComment({
        content: newComment.trim(),
        communityPostId,
      });
      setNewComment("");
      setReplyingTo(null);
      Keyboard.dismiss();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  }, [newComment, addComment, communityPostId]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    [],
  );

  const renderComment = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <CommentItem
        comment={item}
        index={index}
        onReply={handleReply}
      />
    ),
    [handleReply],
  );

  // Empty state pulse animation
  const emptyPulse = useSharedValue(0.5);

  useEffect(() => {
    if (visible && (!comments || comments.length === 0)) {
      emptyPulse.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        true,
      );
    }
  }, [visible, comments, emptyPulse]);

  const emptyPulseStyle = useAnimatedStyle(() => ({
    opacity: emptyPulse.value,
  }));

  // Post button press animation
  const postScale = useSharedValue(1);
  const postScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: postScale.value }],
  }));

  const renderEmpty = useCallback(
    () => (
      <View style={s.emptyState}>
        <Animated.View style={emptyPulseStyle}>
          <Ionicons
            name="chatbubble-outline"
            size={44}
            color={C.textMuted}
          />
        </Animated.View>
        <Typography
          variant="h3"
          weight="bold"
          style={{ color: C.text, marginTop: 16 }}
        >
          No comments yet.
        </Typography>
        <Typography
          variant="body"
          style={{ color: C.textSecondary, marginTop: 8 }}
        >
          Start the conversation.
        </Typography>
      </View>
    ),
    [emptyPulseStyle],
  );

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBackground}
      handleIndicatorStyle={s.handleIndicator}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      {/* Header */}
      <View style={s.header}>
        <Typography
          variant="h4"
          weight="bold"
          style={{ color: C.text }}
        >
          Comments
        </Typography>
      </View>

      {/* Comments List */}
      <BottomSheetFlatList
        data={comments ?? []}
        keyExtractor={(item: any) => item._id}
        renderItem={renderComment}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
      />

      {/* Reply indicator */}
      {replyingTo && (
        <View style={s.replyBar}>
          <Typography
            variant="caption"
            style={{ color: C.textMuted, flex: 1 }}
          >
            Replying to{" "}
            <Typography
              variant="caption"
              weight="semibold"
              style={{ color: C.textSecondary }}
            >
              {replyingTo}
            </Typography>
          </Typography>
          <Pressable
            onPress={() => {
              setReplyingTo(null);
              setNewComment("");
            }}
            hitSlop={8}
          >
            <Ionicons
              name="close"
              size={16}
              color={C.textMuted}
            />
          </Pressable>
        </View>
      )}

      {/* Input Bar */}
      <BottomSheetView
        style={[
          s.inputBar,
          {
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        {/* Current user avatar */}
        {clerkUser?.imageUrl ? (
          <Image
            source={{ uri: clerkUser.imageUrl }}
            style={s.inputAvatar}
            contentFit="cover"
          />
        ) : (
          <View style={s.inputAvatarFallback}>
            <Ionicons
              name="person"
              size={16}
              color={C.textMuted}
            />
          </View>
        )}

        <BottomSheetTextInput
          ref={inputRef}
          style={s.textInput}
          placeholder="Add a comment..."
          placeholderTextColor={C.textMuted}
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={500}
        />

        {/* Post button */}
        {newComment.trim().length > 0 && (
          <Animated.View style={postScaleStyle}>
            <Pressable
              onPressIn={() => {
                postScale.value = withSpring(0.92, {
                  damping: 15,
                  stiffness: 400,
                });
              }}
              onPressOut={() => {
                postScale.value = withSpring(1, {
                  damping: 12,
                  stiffness: 300,
                });
              }}
              onPress={handleAddComment}
              hitSlop={8}
            >
              <Typography
                variant="body"
                weight="bold"
                style={{ color: C.primary }}
              >
                Post
              </Typography>
            </Pressable>
          </Animated.View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

// ── Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  sheetBackground: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handleIndicator: {
    backgroundColor: C.handle,
    width: 36,
    height: 4,
  },

  // Header
  header: {
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexGrow: 1,
  },

  // Comment
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  commentBody: {
    flex: 1,
  },
  commentContent: {
    color: C.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  commentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 6,
  },
  commentLikeBtn: {
    paddingLeft: 12,
    paddingTop: 8,
  },
  commentSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
  },

  // Reply bar
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    backgroundColor: C.bg,
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    backgroundColor: C.bg,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  inputAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    paddingVertical: Platform.OS === "ios" ? 8 : 6,
    maxHeight: 80,
  },

  // Empty
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
});
