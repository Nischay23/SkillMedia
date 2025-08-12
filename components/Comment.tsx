import { View, Text, Image } from "react-native";
import { styles } from "@/styles/feed.styles";
import { formatDistanceToNow } from "date-fns";

interface CommentType {
  content: string;
  _creationTime: number;
  user: {
    fullname: string;
    image: string | undefined;
  };
}

export default function Comment({
  comment,
}: {
  comment: CommentType;
}) {
  return (
    <View style={styles.commentContainer}>
      <Image
        source={{
          uri:
            comment.user.image ||
            "https://via.placeholder.com/40",
        }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <Text style={styles.commentUsername}>
          {comment.user.fullname}
        </Text>
        <Text style={styles.commentText}>
          {comment.content}
        </Text>
        <Text style={styles.commentTime}>
          {formatDistanceToNow(comment._creationTime, {
            addSuffix: true,
          })}
        </Text>
      </View>
    </View>
  );
}
