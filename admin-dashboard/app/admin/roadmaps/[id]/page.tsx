"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  Eye,
  EyeOff,
  GripVertical,
  Target,
  BookOpen,
  Video,
  FileText,
  Code,
  HelpCircle,
  FolderOpen,
  Users,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

type ContentType = "video" | "article" | "practice" | "quiz" | "project";

const CONTENT_TYPE_OPTIONS: { value: ContentType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "video", label: "Video", icon: Video },
  { value: "article", label: "Article", icon: FileText },
  { value: "practice", label: "Practice", icon: Code },
  { value: "quiz", label: "Quiz", icon: HelpCircle },
  { value: "project", label: "Project", icon: FolderOpen },
];

export default function RoadmapEditorPage() {
  const params = useParams();
  const router = useRouter();
  const roadmapId = params.id as Id<"roadmaps">;

  // State for expanded milestones
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());

  // Modal states
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<Id<"milestones"> | null>(null);
  const [editingStepId, setEditingStepId] = useState<Id<"roadmapSteps"> | null>(null);
  const [currentMilestoneId, setCurrentMilestoneId] = useState<Id<"milestones"> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "milestone" | "step"; id: string } | null>(null);

  // Form states
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [stepTitle, setStepTitle] = useState("");
  const [stepDescription, setStepDescription] = useState("");
  const [stepResourceUrl, setStepResourceUrl] = useState("");
  const [stepContentType, setStepContentType] = useState<ContentType | "">("");
  const [stepEstimatedMinutes, setStepEstimatedMinutes] = useState("");

  // Saving states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Queries
  const roadmap = useQuery(api.roadmaps.getRoadmap, { roadmapId });
  const milestones = useQuery(api.roadmaps.getMilestones, { roadmapId });
  const stats = useQuery(api.roadmaps.getRoadmapStats, { roadmapId });

  // Mutations
  const updateRoadmap = useMutation(api.roadmaps.updateRoadmap);
  const createMilestone = useMutation(api.roadmaps.createMilestone);
  const updateMilestone = useMutation(api.roadmaps.updateMilestone);
  const deleteMilestone = useMutation(api.roadmaps.deleteMilestone);
  const createStep = useMutation(api.roadmaps.createStep);
  const updateStep = useMutation(api.roadmaps.updateStep);
  const deleteStep = useMutation(api.roadmaps.deleteStep);

  // Toggle milestone expansion
  const toggleMilestone = (id: string) => {
    setExpandedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Open milestone modal for create/edit
  const openMilestoneModal = (milestone?: { _id: Id<"milestones">; title: string; description?: string }) => {
    if (milestone) {
      setEditingMilestoneId(milestone._id);
      setMilestoneTitle(milestone.title);
      setMilestoneDescription(milestone.description ?? "");
    } else {
      setEditingMilestoneId(null);
      setMilestoneTitle("");
      setMilestoneDescription("");
    }
    setShowMilestoneModal(true);
  };

  // Open step modal for create/edit
  const openStepModal = (
    milestoneId: Id<"milestones">,
    step?: {
      _id: Id<"roadmapSteps">;
      title: string;
      description?: string;
      resourceUrl?: string;
      contentType?: string;
      estimatedMinutes?: number;
    }
  ) => {
    setCurrentMilestoneId(milestoneId);
    if (step) {
      setEditingStepId(step._id);
      setStepTitle(step.title);
      setStepDescription(step.description ?? "");
      setStepResourceUrl(step.resourceUrl ?? "");
      setStepContentType((step.contentType as ContentType) ?? "");
      setStepEstimatedMinutes(step.estimatedMinutes?.toString() ?? "");
    } else {
      setEditingStepId(null);
      setStepTitle("");
      setStepDescription("");
      setStepResourceUrl("");
      setStepContentType("");
      setStepEstimatedMinutes("");
    }
    setShowStepModal(true);
  };

  // Save milestone
  const handleSaveMilestone = async () => {
    if (!milestoneTitle.trim()) return;
    setIsSaving(true);
    try {
      if (editingMilestoneId) {
        await updateMilestone({
          milestoneId: editingMilestoneId,
          title: milestoneTitle.trim(),
          description: milestoneDescription.trim() || undefined,
        });
      } else {
        await createMilestone({
          roadmapId,
          title: milestoneTitle.trim(),
          description: milestoneDescription.trim() || undefined,
        });
      }
      setShowMilestoneModal(false);
    } catch (error) {
      console.error("Failed to save milestone:", error);
      alert("Failed to save milestone");
    } finally {
      setIsSaving(false);
    }
  };

  // Save step
  const handleSaveStep = async () => {
    if (!stepTitle.trim() || !currentMilestoneId) return;
    setIsSaving(true);
    try {
      if (editingStepId) {
        await updateStep({
          stepId: editingStepId,
          title: stepTitle.trim(),
          description: stepDescription.trim() || undefined,
          resourceUrl: stepResourceUrl.trim() || undefined,
          contentType: stepContentType || undefined,
          estimatedMinutes: stepEstimatedMinutes ? parseInt(stepEstimatedMinutes) : undefined,
        });
      } else {
        await createStep({
          milestoneId: currentMilestoneId,
          title: stepTitle.trim(),
          description: stepDescription.trim() || undefined,
          resourceUrl: stepResourceUrl.trim() || undefined,
          contentType: stepContentType || undefined,
          estimatedMinutes: stepEstimatedMinutes ? parseInt(stepEstimatedMinutes) : undefined,
        });
      }
      setShowStepModal(false);
    } catch (error) {
      console.error("Failed to save step:", error);
      alert("Failed to save step");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === "milestone") {
        await deleteMilestone({ milestoneId: deleteTarget.id as Id<"milestones"> });
      } else {
        await deleteStep({ stepId: deleteTarget.id as Id<"roadmapSteps"> });
      }
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle publish status
  const handleTogglePublish = async () => {
    if (!roadmap) return;
    try {
      await updateRoadmap({ roadmapId, isPublished: !roadmap.isPublished });
    } catch (error) {
      console.error("Failed to toggle publish:", error);
      alert("Failed to update status");
    }
  };

  const isLoading = roadmap === undefined || milestones === undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
        <div className="h-60 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">Roadmap not found</p>
        <Link href="/admin/roadmaps" className="mt-4 text-primary hover:underline">
          Back to Roadmaps
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/roadmaps"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{roadmap.title}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {roadmap.groupName} • {roadmap.difficulty ?? "No difficulty set"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleTogglePublish}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              roadmap.isPublished
                ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
            }`}
          >
            {roadmap.isPublished ? (
              <>
                <EyeOff className="h-4 w-4" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Publish
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{milestones?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Milestones</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <BookOpen className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{roadmap.totalSteps ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Steps</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <Users className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats?.usersStarted ?? 0}</p>
              <p className="text-xs text-muted-foreground">Users Started</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats?.avgCompletion ?? 0}%</p>
              <p className="text-xs text-muted-foreground">Avg Completion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Milestones Section */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold text-foreground">Milestones & Steps</h2>
          <button
            onClick={() => openMilestoneModal()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Milestone
          </button>
        </div>

        <div className="divide-y divide-border">
          {milestones && milestones.length > 0 ? (
            milestones.map((milestone) => (
              <MilestoneItem
                key={milestone._id}
                milestone={milestone}
                roadmapId={roadmapId}
                isExpanded={expandedMilestones.has(milestone._id)}
                onToggle={() => toggleMilestone(milestone._id)}
                onEdit={() => openMilestoneModal(milestone)}
                onDelete={() => setDeleteTarget({ type: "milestone", id: milestone._id })}
                onAddStep={() => openStepModal(milestone._id)}
                onEditStep={(step) => openStepModal(milestone._id, step)}
                onDeleteStep={(stepId) => setDeleteTarget({ type: "step", id: stepId })}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No milestones yet</p>
              <button
                onClick={() => openMilestoneModal()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                Add First Milestone
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">
              {editingMilestoneId ? "Edit Milestone" : "Add Milestone"}
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Title</label>
                <input
                  type="text"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  placeholder="e.g., Phase 1: Foundation"
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Description (optional)
                </label>
                <textarea
                  value={milestoneDescription}
                  onChange={(e) => setMilestoneDescription(e.target.value)}
                  placeholder="Brief description of this milestone..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowMilestoneModal(false)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMilestone}
                disabled={!milestoneTitle.trim() || isSaving}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : editingMilestoneId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step Modal */}
      {showStepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">
              {editingStepId ? "Edit Step" : "Add Step"}
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Title</label>
                <input
                  type="text"
                  value={stepTitle}
                  onChange={(e) => setStepTitle(e.target.value)}
                  placeholder="e.g., Learn HTML basics"
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Description (optional)
                </label>
                <textarea
                  value={stepDescription}
                  onChange={(e) => setStepDescription(e.target.value)}
                  placeholder="Instructions or details..."
                  rows={2}
                  className="input-field resize-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Content Type
                </label>
                <select
                  value={stepContentType}
                  onChange={(e) => setStepContentType(e.target.value as ContentType | "")}
                  className="input-field"
                >
                  <option value="">Select type...</option>
                  {CONTENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Resource URL (optional)
                </label>
                <input
                  type="url"
                  value={stepResourceUrl}
                  onChange={(e) => setStepResourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Estimated Minutes (optional)
                </label>
                <input
                  type="number"
                  value={stepEstimatedMinutes}
                  onChange={(e) => setStepEstimatedMinutes(e.target.value)}
                  placeholder="30"
                  min="1"
                  className="input-field"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowStepModal(false)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStep}
                disabled={!stepTitle.trim() || isSaving}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : editingStepId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={deleteTarget?.type === "milestone" ? "Delete Milestone" : "Delete Step"}
        description={
          deleteTarget?.type === "milestone"
            ? "Are you sure you want to delete this milestone? All steps within it will also be deleted."
            : "Are you sure you want to delete this step?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

// Milestone Item Component
function MilestoneItem({
  milestone,
  roadmapId,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddStep,
  onEditStep,
  onDeleteStep,
}: {
  milestone: {
    _id: Id<"milestones">;
    title: string;
    description?: string;
    order: number;
    stepCount: number;
  };
  roadmapId: Id<"roadmaps">;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddStep: () => void;
  onEditStep: (step: {
    _id: Id<"roadmapSteps">;
    title: string;
    description?: string;
    resourceUrl?: string;
    contentType?: string;
    estimatedMinutes?: number;
  }) => void;
  onDeleteStep: (stepId: string) => void;
}) {
  const steps = useQuery(api.roadmaps.getSteps, { milestoneId: milestone._id });

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Milestone Header */}
      <div
        className="flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-muted/50"
        onClick={onToggle}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
          {milestone.order}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{milestone.title}</h3>
          {milestone.description && (
            <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
              {milestone.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{milestone.stepCount} steps</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Save className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-error-muted hover:text-error"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </div>

      {/* Steps */}
      {isExpanded && (
        <div className="border-t border-border bg-muted/30 px-4 py-3">
          {steps && steps.length > 0 ? (
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={step._id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{step.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {step.contentType && (
                        <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 capitalize">
                          {step.contentType}
                        </span>
                      )}
                      {step.estimatedMinutes && <span>{step.estimatedMinutes} min</span>}
                      {step.resourceUrl && (
                        <a
                          href={step.resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Link
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onEditStep(step)}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteStep(step._id)}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-error-muted hover:text-error"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">No steps in this milestone</p>
          )}
          <button
            onClick={onAddStep}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Add Step
          </button>
        </div>
      )}
    </div>
  );
}
