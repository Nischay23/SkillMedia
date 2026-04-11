// app/onboarding.tsx
import { Typography } from "@/components/ui/Typography";
import { api } from "@/convex/_generated/api";
import { useTheme } from "@/providers/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const QUALIFICATIONS = [
  { id: "10th", label: "10th Standard", emoji: "📚" },
  { id: "12th", label: "12th Standard", emoji: "🎓" },
  { id: "diploma", label: "Diploma", emoji: "🛠️" },
  { id: "graduation", label: "Graduation", emoji: "🏆" },
  { id: "postgrad", label: "Post Graduation", emoji: "🔬" },
  { id: "other", label: "Other", emoji: "✨" },
];

const INTERESTS = [
  {
    id: "government",
    label: "Government Jobs",
    emoji: "🏛️",
  },
  { id: "private", label: "Private Jobs", emoji: "💼" },
  { id: "business", label: "Business", emoji: "🚀" },
  { id: "agriculture", label: "Agriculture", emoji: "🌱" },
  { id: "sports", label: "Sports & Fitness", emoji: "💪" },
  { id: "defence", label: "Defence Services", emoji: "🎖️" },
  { id: "it", label: "IT & Technology", emoji: "💻" },
  { id: "healthcare", label: "Healthcare", emoji: "🏥" },
  { id: "education", label: "Education", emoji: "📖" },
  { id: "arts", label: "Arts & Media", emoji: "🎨" },
];

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [selectedQualification, setSelectedQualification] =
    useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] =
    useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const completeOnboarding = useMutation(
    api.userPreferences.completeOnboarding,
  );
  const skipOnboarding = useMutation(
    api.userPreferences.skipOnboarding,
  );

  // Animated logo rotation
  const rotation = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.3);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000 }),
      -1,
      false,
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 }),
      ),
      -1,
      true,
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handleQualificationSelect = (id: string) => {
    setSelectedQualification(id);
  };

  const handleInterestToggle = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(
        selectedInterests.filter((i) => i !== id),
      );
    } else if (selectedInterests.length < 5) {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleComplete = async () => {
    if (
      !selectedQualification ||
      selectedInterests.length === 0
    )
      return;

    setIsLoading(true);
    try {
      await completeOnboarding({
        qualification: selectedQualification,
        interestedCategories: selectedInterests,
      });
      router.replace("/" as any);
    } catch (error) {
      console.error(
        "Failed to complete onboarding:",
        error,
      );
      Alert.alert(
        "Error",
        "Failed to save your preferences. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      await skipOnboarding({});
      router.replace("/" as any);
    } catch (error) {
      console.error("Failed to skip onboarding:", error);
      Alert.alert(
        "Error",
        "Something went wrong. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    stepIndicator: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      marginTop: insets.top + 16,
    },
    dot: {
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.textMuted,
    },
    activeDot: {
      backgroundColor: theme.colors.primary,
    },
    skipButton: {
      position: "absolute",
      top: insets.top + 12,
      right: 20,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
    },
    centeredContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    logoContainer: {
      width: 120,
      height: 120,
      justifyContent: "center",
      alignItems: "center",
    },
    logoGradient: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: "center",
      alignItems: "center",
    },
    pulseRing: {
      position: "absolute",
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    welcomeTitle: {
      marginTop: 32,
      textAlign: "center",
    },
    welcomeSubtitle: {
      marginTop: 12,
      textAlign: "center",
      maxWidth: 280,
    },
    button: {
      borderRadius: 16,
      height: 56,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
      marginHorizontal: 32,
      marginTop: 48,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    header: {
      marginTop: 24,
      marginBottom: 8,
    },
    subtitle: {
      marginBottom: 32,
    },
    qualificationGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      justifyContent: "center",
    },
    qualificationCard: {
      width: "47%",
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 20,
      alignItems: "center",
      gap: 10,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
    },
    qualificationCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + "18",
    },
    checkmark: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    emoji: {
      fontSize: 32,
    },
    interestsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      justifyContent: "center",
    },
    interestPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    interestPillSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    counter: {
      textAlign: "center",
      marginTop: 16,
    },
    bottomButton: {
      marginTop: "auto",
      marginBottom: insets.bottom + 24,
    },
  });

  // Step 1: Welcome
  const renderStep1 = () => (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={styles.centeredContent}
    >
      <View style={styles.logoContainer}>
        <Animated.View
          style={[styles.pulseRing, pulseAnimatedStyle]}
        />
        <Animated.View style={logoAnimatedStyle}>
          <LinearGradient
            colors={["#6C5DD3", "#8676FF"]}
            style={styles.logoGradient}
          >
            <Ionicons
              name="compass"
              size={56}
              color="#FFFFFF"
            />
          </LinearGradient>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInDown.duration(400).delay(200)}
      >
        <Typography
          variant="h1"
          weight="bold"
          style={styles.welcomeTitle}
        >
          Welcome to SkillMedia
        </Typography>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(400).delay(400)}
      >
        <Typography
          variant="body"
          color="textSecondary"
          style={styles.welcomeSubtitle}
        >
          Discover the perfect career path for your future
        </Typography>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(400).delay(600)}
      >
        <Pressable
          onPress={() => setStep(2)}
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}
        >
          <LinearGradient
            colors={[
              theme.colors.primary,
              theme.colors.primaryLight,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Typography
              variant="body"
              weight="bold"
              style={{ color: "#FFFFFF" }}
            >
              Get Started
            </Typography>
            <Ionicons
              name="arrow-forward"
              size={20}
              color="#FFFFFF"
            />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );

  // Step 2: Qualification
  const renderStep2 = () => (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutLeft.duration(300)}
      style={styles.content}
    >
      <Typography
        variant="h2"
        weight="bold"
        style={styles.header}
      >
        What's your qualification?
      </Typography>
      <Typography
        variant="body"
        color="textSecondary"
        style={styles.subtitle}
      >
        We'll show careers perfect for you
      </Typography>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.qualificationGrid}>
          {QUALIFICATIONS.map((qual, index) => {
            const isSelected =
              selectedQualification === qual.id;
            return (
              <Animated.View
                key={qual.id}
                entering={FadeInDown.duration(300).delay(
                  index * 80,
                )}
              >
                <Pressable
                  onPress={() =>
                    handleQualificationSelect(qual.id)
                  }
                  style={({ pressed }) => [
                    styles.qualificationCard,
                    isSelected &&
                      styles.qualificationCardSelected,
                    {
                      transform: [
                        { scale: pressed ? 0.96 : 1 },
                      ],
                    },
                  ]}
                >
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color="#FFFFFF"
                      />
                    </View>
                  )}
                  <Animated.Text style={styles.emoji}>
                    {qual.emoji}
                  </Animated.Text>
                  <Typography
                    variant="body"
                    weight="semibold"
                  >
                    {qual.label}
                  </Typography>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomButton}>
        <Pressable
          onPress={() => setStep(3)}
          disabled={!selectedQualification}
          style={({ pressed }) => [
            {
              transform: [
                {
                  scale:
                    pressed && selectedQualification
                      ? 0.96
                      : 1,
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={
              selectedQualification
                ? [
                    theme.colors.primary,
                    theme.colors.primaryLight,
                  ]
                : [
                    theme.colors.textMuted,
                    theme.colors.textMuted,
                  ]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.button,
              !selectedQualification &&
                styles.buttonDisabled,
            ]}
          >
            <Typography
              variant="body"
              weight="bold"
              style={{ color: "#FFFFFF" }}
            >
              Continue
            </Typography>
            <Ionicons
              name="arrow-forward"
              size={20}
              color="#FFFFFF"
            />
          </LinearGradient>
        </Pressable>
      </View>
    </Animated.View>
  );

  // Step 3: Interests
  const renderStep3 = () => (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutLeft.duration(300)}
      style={styles.content}
    >
      <Typography
        variant="h2"
        weight="bold"
        style={styles.header}
      >
        What interests you?
      </Typography>
      <Typography
        variant="body"
        color="textSecondary"
        style={styles.subtitle}
      >
        Choose up to 5 career categories
      </Typography>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.interestsContainer}>
          {INTERESTS.map((interest, index) => {
            const isSelected = selectedInterests.includes(
              interest.id,
            );
            return (
              <Animated.View
                key={interest.id}
                entering={FadeInDown.duration(300).delay(
                  Math.min(index, 6) * 60,
                )}
              >
                <Pressable
                  onPress={() =>
                    handleInterestToggle(interest.id)
                  }
                  style={({ pressed }) => [
                    styles.interestPill,
                    isSelected &&
                      styles.interestPillSelected,
                    {
                      transform: [
                        { scale: pressed ? 0.96 : 1 },
                      ],
                    },
                  ]}
                >
                  <Animated.Text style={{ fontSize: 16 }}>
                    {interest.emoji}
                  </Animated.Text>
                  <Typography
                    variant="body"
                    weight="medium"
                    color={isSelected ? undefined : "text"}
                    style={
                      isSelected
                        ? { color: "#FFFFFF" }
                        : undefined
                    }
                  >
                    {interest.label}
                  </Typography>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <Typography
          variant="caption"
          color="textSecondary"
          style={styles.counter}
        >
          {selectedInterests.length}/5 selected
        </Typography>
      </ScrollView>

      <View style={styles.bottomButton}>
        <Pressable
          onPress={handleComplete}
          disabled={
            selectedInterests.length === 0 || isLoading
          }
          style={({ pressed }) => [
            {
              transform: [
                {
                  scale:
                    pressed &&
                    selectedInterests.length > 0 &&
                    !isLoading
                      ? 0.96
                      : 1,
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={
              selectedInterests.length > 0
                ? [
                    theme.colors.primary,
                    theme.colors.primaryLight,
                  ]
                : [
                    theme.colors.textMuted,
                    theme.colors.textMuted,
                  ]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.button,
              (selectedInterests.length === 0 ||
                isLoading) &&
                styles.buttonDisabled,
            ]}
          >
            <Typography
              variant="body"
              weight="bold"
              style={{ color: "#FFFFFF" }}
            >
              {isLoading ? "Loading..." : "Start Exploring"}
            </Typography>
            {!isLoading && (
              <Ionicons
                name="arrow-forward"
                size={20}
                color="#FFFFFF"
              />
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        {[1, 2, 3].map((s) => (
          <Animated.View
            key={s}
            style={[
              styles.dot,
              s === step && styles.activeDot,
              {
                width: withSpring(s === step ? 24 : 8),
              },
            ]}
          />
        ))}
      </View>

      {/* Skip Button (steps 2 & 3) */}
      {step > 1 && (
        <Pressable
          onPress={handleSkip}
          style={styles.skipButton}
          disabled={isLoading}
        >
          <Typography variant="body" color="textSecondary">
            Skip
          </Typography>
        </Pressable>
      )}

      {/* Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </View>
  );
}
