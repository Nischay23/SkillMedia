"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/components/admin/Toast";
import { X, Loader2, Plus } from "lucide-react";

interface FilterOption {
  _id: Id<"FilterOption">;
  name: string;
  type: string;
  parentId?: Id<"FilterOption">;
}

type FilterType = "qualification" | "category" | "sector" | "subSector" | "branch" | "role";

interface AddFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parent?: FilterOption | null;
}

// Hierarchy rules
const childTypeMap: Record<string, FilterType> = {
  qualification: "category",
  category: "sector",
  sector: "subSector",
  subSector: "branch",
  branch: "role",
};

const typeLabels: Record<string, string> = {
  qualification: "Qualification",
  category: "Category",
  sector: "Sector",
  subSector: "Sub-Sector",
  branch: "Branch",
  role: "Role",
};

export function AddFilterModal({
  isOpen,
  onClose,
  onSuccess,
  parent,
}: AddFilterModalProps) {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [avgSalary, setAvgSalary] = useState("");
  const [relevantExams, setRelevantExams] = useState("");
  const [image, setImage] = useState("");

  // Determine the type based on parent
  const filterType: FilterType = parent
    ? childTypeMap[parent.type] || "category"
    : "qualification";

  // Mutation
  const createFilter = useMutation(api.adminFilters.createFilterNode);

  // Reset form
  const resetForm = () => {
    setName("");
    setDescription("");
    setRequirements("");
    setAvgSalary("");
    setRelevantExams("");
    setImage("");
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      addToast({
        type: "error",
        title: "Validation Error",
        description: "Name is required.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createFilter({
        name: name.trim(),
        type: filterType,
        parentId: parent?._id,
        description: description.trim() || undefined,
        requirements: requirements.trim() || undefined,
        avgSalary: avgSalary.trim() || undefined,
        relevantExams: relevantExams.trim() || undefined,
        image: image.trim() || undefined,
      });

      addToast({
        type: "success",
        title: "Filter Created",
        description: `"${name}" has been created successfully.`,
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      addToast({
        type: "error",
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "An error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-[#2d3748] bg-[#111827] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2d3748] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#e5e7eb]">
              Add {typeLabels[filterType]}
            </h2>
            {parent && (
              <p className="mt-0.5 text-sm text-[#9ca3af]">
                Under: {parent.name}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-[#9ca3af] transition-colors hover:bg-[#2d3748] hover:text-[#e5e7eb]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
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
                placeholder={`Enter ${typeLabels[filterType].toLowerCase()} name...`}
                className="w-full rounded-lg border border-[#2d3748] bg-[#0b0f19] px-4 py-2.5 text-[#e5e7eb] placeholder-[#9ca3af] focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                autoFocus
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
                placeholder="Brief description..."
                rows={2}
                className="w-full resize-none rounded-lg border border-[#2d3748] bg-[#0b0f19] px-4 py-2.5 text-[#e5e7eb] placeholder-[#9ca3af] focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#e5e7eb]">
                Requirements
              </label>
              <input
                type="text"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Education, certifications, etc."
                className="w-full rounded-lg border border-[#2d3748] bg-[#0b0f19] px-4 py-2.5 text-[#e5e7eb] placeholder-[#9ca3af] focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
              />
            </div>

            {/* Two columns */}
            <div className="grid grid-cols-2 gap-4">
              {/* Avg Salary */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[#e5e7eb]">
                  Avg Salary
                </label>
                <input
                  type="text"
                  value={avgSalary}
                  onChange={(e) => setAvgSalary(e.target.value)}
                  placeholder="e.g., $50k-$80k"
                  className="w-full rounded-lg border border-[#2d3748] bg-[#0b0f19] px-4 py-2.5 text-[#e5e7eb] placeholder-[#9ca3af] focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
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
                  placeholder="Exam names"
                  className="w-full rounded-lg border border-[#2d3748] bg-[#0b0f19] px-4 py-2.5 text-[#e5e7eb] placeholder-[#9ca3af] focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                />
              </div>
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
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-lg border border-[#2d3748] bg-[#0b0f19] px-4 py-2.5 text-[#e5e7eb] placeholder-[#9ca3af] focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-[#2d3748] bg-transparent px-4 py-2.5 text-sm font-medium text-[#e5e7eb] transition-colors hover:bg-[#2d3748] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#10b981] px-4 py-2.5 text-sm font-medium text-[#0b0f19] transition-colors hover:bg-[#059669] disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create {typeLabels[filterType]}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
