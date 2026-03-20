"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/components/admin/Toast";
import { X, Loader2, Plus, Info, Briefcase, Trophy } from "lucide-react";

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

// Format vacancies: 45000 → "~45k/yr"
function formatVacancies(num: number): string {
  if (num >= 1000000) {
    return `~${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M/yr`;
  }
  if (num >= 1000) {
    return `~${Math.round(num / 1000)}k/yr`;
  }
  return `~${num}/yr`;
}

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
  const [ranking, setRanking] = useState("");
  const [annualVacancies, setAnnualVacancies] = useState("");

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
    setRanking("");
    setAnnualVacancies("");
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
        ranking: ranking ? parseInt(ranking, 10) : undefined,
        annualVacancies: annualVacancies ? parseInt(annualVacancies, 10) : undefined,
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

  const rankingNum = ranking ? parseInt(ranking, 10) : null;
  const vacanciesNum = annualVacancies ? parseInt(annualVacancies, 10) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-theme-xl animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Add {typeLabels[filterType]}
            </h2>
            {parent && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                Under: {parent.name}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Enter ${typeLabels[filterType].toLowerCase()} name...`}
                className="input-field"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                rows={2}
                className="input-field resize-none"
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Requirements
              </label>
              <input
                type="text"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Education, certifications, etc."
                className="input-field"
              />
            </div>

            {/* Two columns */}
            <div className="grid grid-cols-2 gap-4">
              {/* Avg Salary */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Avg Salary
                </label>
                <input
                  type="text"
                  value={avgSalary}
                  onChange={(e) => setAvgSalary(e.target.value)}
                  placeholder="e.g., 3-6 LPA"
                  className="input-field"
                />
              </div>

              {/* Relevant Exams */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Relevant Exams
                </label>
                <input
                  type="text"
                  value={relevantExams}
                  onChange={(e) => setRelevantExams(e.target.value)}
                  placeholder="Exam names"
                  className="input-field"
                />
              </div>
            </div>

            {/* Two columns: Ranking & Annual Vacancies */}
            <div className="grid grid-cols-2 gap-4">
              {/* Ranking */}
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Trophy className="h-4 w-4 text-primary" />
                  Ranking
                  <span className="group relative">
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-40 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg z-10">
                      Lower number = higher demand. #1 is the top career.
                    </span>
                  </span>
                </label>
                <input
                  type="number"
                  value={ranking}
                  onChange={(e) => setRanking(e.target.value)}
                  placeholder="e.g., 1"
                  min="1"
                  className="input-field"
                />
                {/* Live badge preview */}
                {rankingNum && rankingNum > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Preview:</span>
                    <span className="inline-flex items-center rounded-lg bg-gradient-to-r from-primary to-primary/70 px-2 py-0.5 text-xs font-bold text-white">
                      #{rankingNum}
                    </span>
                  </div>
                )}
              </div>

              {/* Annual Vacancies */}
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Briefcase className="h-4 w-4 text-emerald-500" />
                  Annual Vacancies
                </label>
                <input
                  type="number"
                  value={annualVacancies}
                  onChange={(e) => setAnnualVacancies(e.target.value)}
                  placeholder="e.g., 45000"
                  min="0"
                  className="input-field"
                />
                {/* Live formatted preview */}
                {vacanciesNum && vacanciesNum > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Preview:</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-500">
                      <Briefcase className="h-3 w-3" />
                      {formatVacancies(vacanciesNum)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Image URL
              </label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="input-field"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="btn-primary flex flex-1 items-center justify-center gap-2 disabled:opacity-50"
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
