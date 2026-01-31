"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/components/admin/Toast";
import {
  X,
  Edit,
  Power,
  Briefcase,
  BookOpen,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Save,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  _id: Id<"FilterOption">;
  name: string;
  type: string;
  parentId?: Id<"FilterOption">;
  description?: string;
  requirements?: string;
  avgSalary?: string;
  relevantExams?: string;
  image?: string;
  isActive?: boolean;
  likes?: number;
  comments?: number;
}

interface FilterInspectorProps {
  filter: FilterOption | null;
  onClose: () => void;
  onUpdate: () => void;
}

// Type labels for display
const typeLabels: Record<string, string> = {
  qualification: "Qualification",
  category: "Category",
  sector: "Sector",
  subSector: "Sub-Sector",
  branch: "Branch",
  role: "Role",
};

export function FilterInspector({
  filter,
  onClose,
  onUpdate,
}: FilterInspectorProps) {
  const { addToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Form state
  const [name, setName] = useState(filter?.name || "");
  const [description, setDescription] = useState(filter?.description || "");
  const [requirements, setRequirements] = useState(filter?.requirements || "");
  const [avgSalary, setAvgSalary] = useState(filter?.avgSalary || "");
  const [relevantExams, setRelevantExams] = useState(filter?.relevantExams || "");
  const [image, setImage] = useState(filter?.image || "");

  // Mutations
  const updateFilter = useMutation(api.adminFilters.updateFilterNode);
  const toggleActive = useMutation(api.adminFilters.toggleFilterActive);

  // Reset form when filter changes
  const resetForm = () => {
    setName(filter?.name || "");
    setDescription(filter?.description || "");
    setRequirements(filter?.requirements || "");
    setAvgSalary(filter?.avgSalary || "");
    setRelevantExams(filter?.relevantExams || "");
    setImage(filter?.image || "");
    setIsEditing(false);
  };

  // Handle save
  const handleSave = async () => {
    if (!filter || !name.trim()) {
      addToast({
        type: "error",
        title: "Validation Error",
        description: "Name is required.",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateFilter({
        filterId: filter._id,
        name: name.trim(),
        description: description.trim() || undefined,
        requirements: requirements.trim() || undefined,
        avgSalary: avgSalary.trim() || undefined,
        relevantExams: relevantExams.trim() || undefined,
        image: image.trim() || undefined,
      });

      addToast({
        type: "success",
        title: "Filter Updated",
        description: `"${name}" has been updated successfully.`,
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      addToast({
        type: "error",
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle toggle active
  const handleToggleActive = async () => {
    if (!filter) return;

    setIsToggling(true);
    try {
      await toggleActive({
        filterId: filter._id,
        isActive: !filter.isActive,
      });

      addToast({
        type: "success",
        title: filter.isActive ? "Filter Deactivated" : "Filter Activated",
        description: filter.isActive
          ? `"${filter.name}" and its children have been deactivated.`
          : `"${filter.name}" has been activated.`,
      });

      onUpdate();
    } catch (error) {
      addToast({
        type: "error",
        title: "Action Failed",
        description: error instanceof Error ? error.message : "An error occurred.",
      });
    } finally {
      setIsToggling(false);
    }
  };

  if (!filter) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-[#9ca3af]">
          Select a filter to view details
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2d3748] p-4">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-medium uppercase tracking-wider text-[#9ca3af]">
            {typeLabels[filter.type] || filter.type}
          </span>
          <h3 className="truncate text-lg font-semibold text-[#e5e7eb]">
            {filter.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="ml-2 rounded-lg p-2 text-[#9ca3af] transition-colors hover:bg-[#2d3748] hover:text-[#e5e7eb]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isEditing ? (
          // Edit Form
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#e5e7eb]">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[#2d3748] bg-[#0b0f19] px-3 py-2 text-sm text-[#e5e7eb] focus:border-[#10b981] focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#e5e7eb]">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-[#2d3748] bg-[#0b0f19] px-3 py-2 text-sm text-[#e5e7eb] focus:border-[#10b981] focus:outline-none"
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#e5e7eb]">
                Requirements
              </label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-[#2d3748] bg-[#0b0f19] px-3 py-2 text-sm text-[#e5e7eb] focus:border-[#10b981] focus:outline-none"
              />
            </div>

            {/* Avg Salary */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#e5e7eb]">
                Average Salary
              </label>
              <input
                type="text"
                value={avgSalary}
                onChange={(e) => setAvgSalary(e.target.value)}
                placeholder="e.g., $50,000 - $80,000"
                className="w-full rounded-lg border border-[#2d3748] bg-[#0b0f19] px-3 py-2 text-sm text-[#e5e7eb] focus:border-[#10b981] focus:outline-none"
              />
            </div>

            {/* Relevant Exams */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#e5e7eb]">
                Relevant Exams
              </label>
              <input
                type="text"
                value={relevantExams}
                onChange={(e) => setRelevantExams(e.target.value)}
                className="w-full rounded-lg border border-[#2d3748] bg-[#0b0f19] px-3 py-2 text-sm text-[#e5e7eb] focus:border-[#10b981] focus:outline-none"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#e5e7eb]">
                Image URL
              </label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full rounded-lg border border-[#2d3748] bg-[#0b0f19] px-3 py-2 text-sm text-[#e5e7eb] focus:border-[#10b981] focus:outline-none"
              />
            </div>
          </div>
        ) : (
          // View Mode
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                  filter.isActive !== false
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    filter.isActive !== false ? "bg-emerald-400" : "bg-red-400"
                  )}
                />
                {filter.isActive !== false ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Description */}
            {filter.description && (
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#9ca3af]">
                  <FileText className="h-3.5 w-3.5" />
                  Description
                </div>
                <p className="text-sm text-[#e5e7eb]">{filter.description}</p>
              </div>
            )}

            {/* Requirements */}
            {filter.requirements && (
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#9ca3af]">
                  <BookOpen className="h-3.5 w-3.5" />
                  Requirements
                </div>
                <p className="text-sm text-[#e5e7eb]">{filter.requirements}</p>
              </div>
            )}

            {/* Avg Salary */}
            {filter.avgSalary && (
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#9ca3af]">
                  <DollarSign className="h-3.5 w-3.5" />
                  Average Salary
                </div>
                <p className="text-sm text-[#e5e7eb]">{filter.avgSalary}</p>
              </div>
            )}

            {/* Relevant Exams */}
            {filter.relevantExams && (
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#9ca3af]">
                  <Briefcase className="h-3.5 w-3.5" />
                  Relevant Exams
                </div>
                <p className="text-sm text-[#e5e7eb]">{filter.relevantExams}</p>
              </div>
            )}

            {/* Image */}
            {filter.image && (
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#9ca3af]">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Image
                </div>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-[#2d3748]">
                  <img
                    src={filter.image}
                    alt={filter.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-[#0b0f19] p-3">
              <div>
                <p className="text-xs text-[#9ca3af]">Likes</p>
                <p className="text-lg font-semibold text-[#e5e7eb]">
                  {filter.likes || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#9ca3af]">Comments</p>
                <p className="text-lg font-semibold text-[#e5e7eb]">
                  {filter.comments || 0}
                </p>
              </div>
            </div>

            {/* No content message */}
            {!filter.description &&
              !filter.requirements &&
              !filter.avgSalary &&
              !filter.relevantExams &&
              !filter.image && (
                <p className="py-4 text-center text-sm text-[#9ca3af]">
                  No additional details. Click Edit to add content.
                </p>
              )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-[#2d3748] p-4">
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={() => resetForm()}
              disabled={isSaving}
              className="flex-1 rounded-lg border border-[#2d3748] bg-transparent px-4 py-2 text-sm font-medium text-[#e5e7eb] transition-colors hover:bg-[#2d3748] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#10b981] px-4 py-2 text-sm font-medium text-[#0b0f19] transition-colors hover:bg-[#059669] disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                resetForm();
                setIsEditing(true);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#2d3748] bg-transparent px-4 py-2 text-sm font-medium text-[#e5e7eb] transition-colors hover:bg-[#2d3748]"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={handleToggleActive}
              disabled={isToggling}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
                filter.isActive !== false
                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              )}
            >
              {isToggling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Power className="h-4 w-4" />
              )}
              {filter.isActive !== false ? "Deactivate" : "Activate"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
