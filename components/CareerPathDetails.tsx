// app/components/CareerPathDetails.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-expo";

import { FilterOption } from "@/types";

interface CareerPathDetailsProps {
  filterOption: FilterOption;
}

export default function CareerPathDetails({ filterOption }: CareerPathDetailsProps) {
  const { user: clerkUser } = useUser();

  // Query if the current user has liked this career path (temporarily disabled)
  const isLiked = false; // useQuery(api.likes.getIsLiked, clerkUser ? { filterOptionId: filterOption._id } : "skip");
  
  // Query if the current user has saved this career path
  const isSaved = useQuery(
    api.savedContent.getIsSaved,
    clerkUser ? { filterOptionId: filterOption._id } : "skip"
  );

  // Mutations for interaction (likes temporarily disabled)
  // const toggleLikeMutation = useMutation(api.likes.toggleLike);
  const toggleSaveMutation = useMutation(api.savedContent.toggleSave);

  const handleLike = async () => {
    if (!clerkUser) {
      console.warn("User not logged in. Cannot like career path.");
      return;
    }
    // TODO: Implement likes functionality when API is available
    console.log("Like functionality coming soon");
  };

  const handleSave = async () => {
    if (!clerkUser) {
      console.warn("User not logged in. Cannot save career path.");
      return;
    }
    try {
      await toggleSaveMutation({
        filterOptionId: filterOption._id,
      });
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const renderRequirements = () => {
    if (!filterOption.requirements) return null;
    
    // Split requirements by commas or line breaks
    const requirements = filterOption.requirements.split(/[,\n]/).map(req => req.trim()).filter(req => req);
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Requirements</Text>
        {requirements.map((requirement, index) => (
          <View key={index} style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.requirementText}>{requirement}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderExams = () => {
    if (!filterOption.relevantExams) return null;
    
    const exams = filterOption.relevantExams.split(',').map(exam => exam.trim()).filter(exam => exam);
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Relevant Exams</Text>
        <View style={styles.examContainer}>
          {exams.map((exam, index) => (
            <View key={index} style={styles.examTag}>
              <Text style={styles.examText}>{exam}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with career path name and type */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{filterOption.name}</Text>
          <View style={styles.typeTag}>
            <Text style={styles.typeText}>{filterOption.type.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Career path image */}
      {filterOption.image && (
        <Image
          source={{ uri: filterOption.image }}
          style={styles.image}
          contentFit="cover"
        />
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Description */}
        {filterOption.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Career Path</Text>
            <Text style={styles.description}>{filterOption.description}</Text>
          </View>
        )}

        {/* Average Salary */}
        {filterOption.avgSalary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Average Salary</Text>
            <View style={styles.salaryContainer}>
              <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
              <Text style={styles.salaryText}>{filterOption.avgSalary}</Text>
            </View>
          </View>
        )}

        {/* Requirements */}
        {renderRequirements()}

        {/* Relevant Exams */}
        {renderExams()}
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, isLiked && styles.likedButton]}
          onPress={handleLike}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? COLORS.white : COLORS.primary}
          />
          <Text style={[styles.actionText, isLiked && styles.likedText]}>
            {filterOption.likes || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isSaved && styles.savedButton]}
          onPress={handleSave}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={24}
            color={isSaved ? COLORS.white : COLORS.primary}
          />
          <Text style={[styles.actionText, isSaved && styles.savedText]}>
            {isSaved ? "Saved" : "Save"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={24} color={COLORS.primary} />
          <Text style={styles.actionText}>
            {filterOption.comments || 0}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    flex: 1,
  },
  typeTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  typeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 200,
  },
  content: {
    maxHeight: 400,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  salaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bullet: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 8,
    marginTop: 2,
  },
  requirementText: {
    fontSize: 14,
    color: COLORS.gray,
    flex: 1,
  },
  examContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  examTag: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  examText: {
    fontSize: 12,
    color: COLORS.black,
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  likedButton: {
    backgroundColor: COLORS.primary,
  },
  savedButton: {
    backgroundColor: COLORS.primary,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  likedText: {
    color: COLORS.white,
  },
  savedText: {
    color: COLORS.white,
  },
});
