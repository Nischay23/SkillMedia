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
        ranking: ranking !== "" ? Number(ranking) : undefined,
        annualVacancies: annualVacancies !== "" ? Number(annualVacancies) : undefined,
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
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card shadow-theme-xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
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
                  placeholder="e.g., $50k-$80k"
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

            {/* Ranking + Annual Vacancies row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Ranking */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Ranking
                </label>
                <input
                  type="number"
                  min={1}
                  value={ranking}
                  onChange={(e) => setRanking(e.target.value)}
                  placeholder="e.g. 1"
                  className="input-field"
                />
                {ranking !== "" && Number(ranking) > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Preview: #{ranking} demand rank
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Lower = higher priority (1 = most in demand)
                </p>
              </div>

              {/* Annual Vacancies */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Annual Vacancies
                </label>
                <input
                  type="number"
                  min={0}
                  value={annualVacancies}
                  onChange={(e) => setAnnualVacancies(e.target.value)}
                  placeholder="e.g. 45000"
                  className="input-field"
                />
                {annualVacancies !== "" && Number(annualVacancies) > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    ~{Number(annualVacancies) >= 1000
                      ? `${Math.round(Number(annualVacancies) / 1000)}k`
                      : annualVacancies}{" "}
                    vacancies/yr
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Approx. job openings per year
                </p>
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
