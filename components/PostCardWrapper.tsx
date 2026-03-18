// components/PostCardWrapper.tsx
// Wrapper that owns per-post like/save queries for ExpertPostCard & DiscussionPostCard
import React, { useState, useEffect } from "react";

import {
  ExpertPostCard,
  DiscussionPostCard,
} from "@/components/cards/PostCardVariants";
import { api } from "@/convex/_generated/api";
import type { CommunityPost as CommunityPostType } from "@/types";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";

interface PostCardWrapperProps {
  post: CommunityPostType;
  variant: "expert" | "discussion";
  onOpenComments: () => void;
}

function formatTimeAgo(timestamp: number): string {
  const diffH = (Date.now() - timestamp) / 3_600_000;
  if (diffH < 1)
    return `${Math.max(1, Math.floor(diffH * 60))}m ago`;
  if (diffH < 24) return `${Math.floor(diffH)}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

export default function PostCardWrapper({
  post,
  variant,
  onOpenComments,
}: PostCardWrapperProps) {
  const { user: clerkUser } = useUser();

  // Per-post queries
  const isLikedQuery = useQuery(
    api.likes.getIsLiked,
    clerkUser ? { communityPostId: post._id } : "skip",
  );
  const isSavedQuery = useQuery(
    api.savedContent.getIsSaved,
    clerkUser ? { communityPostId: post._id } : "skip",
  );

  // Optimistic like state
  const [optLiked, setOptLiked] = useState<boolean | null>(
    null,
  );
  const [optCount, setOptCount] = useState(post.likes ?? 0);

  // Optimistic save state
  const [optSaved, setOptSaved] = useState<boolean | null>(
    null,
  );

  // Sync from server
  useEffect(() => {
    if (isLikedQuery !== undefined)
      setOptLiked(isLikedQuery);
  }, [isLikedQuery]);
  useEffect(() => {
    setOptCount(post.likes ?? 0);
  }, [post.likes]);
  useEffect(() => {
    if (isSavedQuery !== undefined)
      setOptSaved(isSavedQuery);
  }, [isSavedQuery]);

  // Mutations
  const toggleLike = useMutation(api.likes.toggleLike);
  const toggleSave = useMutation(
    api.savedContent.toggleSave,
  );

  const handleLike = async () => {
    if (!clerkUser) return;
    const wasLiked = optLiked === true;
    setOptLiked(!wasLiked);
    setOptCount((c) =>
      wasLiked ? Math.max(0, c - 1) : c + 1,
    );
    try {
      await toggleLike({ communityPostId: post._id });
    } catch {
      setOptLiked(wasLiked);
      setOptCount((c) =>
        wasLiked ? c + 1 : Math.max(0, c - 1),
      );
    }
  };

  const handleSave = async () => {
    if (!clerkUser) return;
    const wasSaved = optSaved === true;
    setOptSaved(!wasSaved);
    try {
      await toggleSave({ communityPostId: post._id });
    } catch {
      setOptSaved(wasSaved);
    }
  };

  const displayLiked = optLiked ?? isLikedQuery === true;
  const displaySaved = optSaved ?? isSavedQuery === true;

  const shared = {
    postId: post._id,
    authorName:
      post.user?.fullname ||
      post.user?.username ||
      "Unknown",
    authorImage: post.user?.profileImage,
    imageUrl: post.imageUrl,
    content: post.title || post.content,
    createdAt: formatTimeAgo(post.createdAt),
    likes: optCount,
    comments: post.comments,
    saves: 0,
    isLiked: displayLiked,
    isSaved: displaySaved,
    onLike: handleLike,
    onComment: onOpenComments,
    onSave: handleSave,
  };

  if (variant === "expert") {
    return (
      <ExpertPostCard
        {...shared}
        tags={post.linkedFilterOptionNames}
      />
    );
  }

  return (
    <DiscussionPostCard
      {...shared}
      answerCount={post.comments}
      isTrending={post.likes >= 5}
    />
  );
}
