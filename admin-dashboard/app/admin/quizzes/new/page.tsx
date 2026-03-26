"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  GripVertical,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface QuestionDraft {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function NewQuizPage() {
  const router = useRouter();

  // Quiz settings
  const [groupId, setGroupId] = useState<Id<"groups"> | "">(
    "",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState<number | "">(
    "",
  );
  const [passingScore, setPassingScore] = useState<
    number | ""
  >("");

  // Questions
  const [questions, setQuestions] = useState<
    QuestionDraft[]
  >([]);
  const [editingQuestion, setEditingQuestion] = useState<
    string | null
  >(null);

  // State
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Fetch groups
  const groups = useQuery(api.quizzes.getGroupsForQuiz);

  // Mutations
  const createQuiz = useMutation(api.quizzes.createQuiz);
  const addQuestion = useMutation(api.quizzes.addQuestion);
  const publishQuiz = useMutation(api.quizzes.publishQuiz);

  // Add new question
  const handleAddQuestion = () => {
    const newQuestion: QuestionDraft = {
      id: `temp-${Date.now()}`,
      text: "",
      options: ["", "", "", ""],
      correctIndex: 0,
      explanation: "",
    };
    setQuestions([...questions, newQuestion]);
    setEditingQuestion(newQuestion.id);
  };

  // Update question
  const handleUpdateQuestion = (
    id: string,
    updates: Partial<QuestionDraft>,
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q,
      ),
    );
  };

  // Delete question
  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
    if (editingQuestion === id) {
      setEditingQuestion(null);
    }
  };

  // Update option
  const handleUpdateOption = (
    questionId: string,
    optionIndex: number,
    value: string,
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      }),
    );
  };

  // Add option
  const handleAddOption = (questionId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options.length < 6) {
          return { ...q, options: [...q.options, ""] };
        }
        return q;
      }),
    );
  };

  // Remove option
  const handleRemoveOption = (
    questionId: string,
    optionIndex: number,
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options.length > 2) {
          const newOptions = q.options.filter(
            (_, i) => i !== optionIndex,
          );
          const newCorrectIndex =
            q.correctIndex >= newOptions.length
              ? newOptions.length - 1
              : q.correctIndex > optionIndex
                ? q.correctIndex - 1
                : q.correctIndex;
          return {
            ...q,
            options: newOptions,
            correctIndex: newCorrectIndex,
          };
        }
        return q;
      }),
    );
  };

  // Validate form
  const validate = (): string[] => {
    const errs: string[] = [];
    if (!groupId) errs.push("Please select a group");
    if (!title.trim()) errs.push("Quiz title is required");
    if (questions.length === 0)
      errs.push("Add at least one question");

    questions.forEach((q, index) => {
      if (!q.text.trim()) {
        errs.push(
          `Question ${index + 1}: Text is required`,
        );
      }
      const filledOptions = q.options.filter((o) =>
        o.trim(),
      );
      if (filledOptions.length < 2) {
        errs.push(
          `Question ${index + 1}: At least 2 options are required`,
        );
      }
      if (!q.options[q.correctIndex]?.trim()) {
        errs.push(
          `Question ${index + 1}: Correct answer cannot be empty`,
        );
      }
    });

    return errs;
  };

  // Save quiz
  const handleSave = async (publish: boolean = false) => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setIsSaving(true);

    try {
      // Create quiz
      const quizId = await createQuiz({
        groupId: groupId as Id<"groups">,
        title: title.trim(),
        description: description.trim() || undefined,
        timeLimit: timeLimit
          ? Number(timeLimit)
          : undefined,
        passingScore: passingScore
          ? Number(passingScore)
          : undefined,
      });

      // Add questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await addQuestion({
          quizId,
          text: q.text.trim(),
          options: q.options.filter((o) => o.trim()),
          correctIndex: q.correctIndex,
          explanation: q.explanation.trim() || undefined,
          order: i,
        });
      }

      // Publish if requested
      if (publish) {
        await publishQuiz({ quizId });
      }

      router.push("/admin/quizzes");
    } catch (error) {
      console.error("Failed to save quiz:", error);
      setErrors(["Failed to save quiz. Please try again."]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/quizzes"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            Create New Quiz
          </h1>
          <p className="mt-1 text-muted-foreground">
            Create a quiz with multiple choice questions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
            Save & Publish
          </button>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              {errors.map((error, i) => (
                <p key={i} className="text-sm text-red-500">
                  {error}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[400px,1fr]">
        {/* Left Column: Settings */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Quiz Settings
            </h2>

            <div className="space-y-4">
              {/* Group Selection */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Select Group{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={groupId}
                  onChange={(e) =>
                    setGroupId(
                      e.target.value as Id<"groups"> | "",
                    )
                  }
                  className="input-field"
                >
                  <option value="">
                    Choose a group...
                  </option>
                  {groups?.map((group) => (
                    <option
                      key={group._id}
                      value={group._id}
                    >
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Quiz Title{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., NDA General Knowledge Test"
                  className="input-field"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Brief description of this quiz..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              {/* Time Limit */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) =>
                    setTimeLimit(
                      e.target.value
                        ? Number(e.target.value)
                        : "",
                    )
                  }
                  placeholder="Leave empty for no limit"
                  min={1}
                  className="input-field"
                />
              </div>

              {/* Passing Score */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Passing Score (number of correct answers)
                </label>
                <input
                  type="number"
                  value={passingScore}
                  onChange={(e) =>
                    setPassingScore(
                      e.target.value
                        ? Number(e.target.value)
                        : "",
                    )
                  }
                  placeholder="Leave empty for no passing threshold"
                  min={0}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Quiz Summary
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Questions
                </span>
                <span className="text-sm font-medium text-foreground">
                  {questions.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Options
                </span>
                <span className="text-sm font-medium text-foreground">
                  {questions.reduce(
                    (sum, q) => sum + q.options.length,
                    0,
                  )}
                </span>
              </div>
              {timeLimit && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Time per Question
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {questions.length > 0
                      ? `${Math.round((Number(timeLimit) * 60) / questions.length)}s`
                      : "—"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Questions ({questions.length})
            </h2>
            <button
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Plus className="h-4 w-4" />
              Add Question
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-4 text-muted-foreground">
                No questions yet
              </p>
              <button
                onClick={handleAddQuestion}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                Add First Question
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  {/* Question Header */}
                  <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="text-sm font-medium text-foreground">
                      Question {index + 1}
                    </span>
                    <div className="flex-1" />
                    <button
                      onClick={() =>
                        setEditingQuestion(
                          editingQuestion === question.id
                            ? null
                            : question.id,
                        )
                      }
                      className="text-xs text-primary hover:underline"
                    >
                      {editingQuestion === question.id
                        ? "Collapse"
                        : "Edit"}
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteQuestion(question.id)
                      }
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Question Content */}
                  <div className="p-4">
                    {editingQuestion === question.id ? (
                      <div className="space-y-4">
                        {/* Question Text */}
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Question Text
                          </label>
                          <textarea
                            value={question.text}
                            onChange={(e) =>
                              handleUpdateQuestion(
                                question.id,
                                {
                                  text: e.target.value,
                                },
                              )
                            }
                            placeholder="Enter your question..."
                            rows={2}
                            className="input-field resize-none"
                          />
                        </div>

                        {/* Options */}
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Answer Options
                          </label>
                          <div className="space-y-2">
                            {question.options.map(
                              (option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center gap-2"
                                >
                                  <button
                                    onClick={() =>
                                      handleUpdateQuestion(
                                        question.id,
                                        {
                                          correctIndex:
                                            optIndex,
                                        },
                                      )
                                    }
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                      question.correctIndex ===
                                      optIndex
                                        ? "border-emerald-500 bg-emerald-500 text-white"
                                        : "border-border hover:border-primary"
                                    }`}
                                    title="Mark as correct answer"
                                  >
                                    {question.correctIndex ===
                                      optIndex && (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </button>
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) =>
                                      handleUpdateOption(
                                        question.id,
                                        optIndex,
                                        e.target.value,
                                      )
                                    }
                                    placeholder={`Option ${optIndex + 1}`}
                                    className="input-field flex-1"
                                  />
                                  {question.options.length >
                                    2 && (
                                    <button
                                      onClick={() =>
                                        handleRemoveOption(
                                          question.id,
                                          optIndex,
                                        )
                                      }
                                      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              ),
                            )}
                          </div>
                          {question.options.length < 6 && (
                            <button
                              onClick={() =>
                                handleAddOption(question.id)
                              }
                              className="mt-2 text-xs text-primary hover:underline"
                            >
                              + Add Option
                            </button>
                          )}
                        </div>

                        {/* Explanation */}
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Explanation (shown after
                            answering)
                          </label>
                          <textarea
                            value={question.explanation}
                            onChange={(e) =>
                              handleUpdateQuestion(
                                question.id,
                                {
                                  explanation:
                                    e.target.value,
                                },
                              )
                            }
                            placeholder="Explain why the correct answer is correct..."
                            rows={2}
                            className="input-field resize-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-foreground">
                          {question.text || (
                            <span className="text-muted-foreground italic">
                              No question text
                            </span>
                          )}
                        </p>
                        <div className="mt-3 space-y-1.5">
                          {question.options
                            .filter((o) => o.trim())
                            .map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                                  question.correctIndex ===
                                  optIndex
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {question.correctIndex ===
                                  optIndex && (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                {option}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
