"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FilterTree } from "@/components/admin/FilterTree";
import { FilterInspector } from "@/components/admin/FilterInspector";
import { AddFilterModal } from "@/components/admin/AddFilterModal";
import { ListTree, Search, Loader2 } from "lucide-react";

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

export default function FiltersPage() {
  // State
  const [selectedFilter, setSelectedFilter] = useState<FilterOption | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalParent, setAddModalParent] = useState<FilterOption | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all filters
  const filters = useQuery(api.filter.getAllFilterOptions);

  const isLoading = filters === undefined;

  // Filter by search query
  const filteredFilters = filters?.filter((f) => {
    if (!searchQuery) return true;
    return f.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate stats
  const stats = filters
    ? {
        total: filters.length,
        active: filters.filter((f) => f.isActive !== false).length,
        qualifications: filters.filter((f) => f.type === "qualification").length,
        categories: filters.filter((f) => f.type === "category").length,
        sectors: filters.filter((f) => f.type === "sector").length,
        roles: filters.filter((f) => f.type === "role").length,
      }
    : null;

  // Handle add child
  const handleAddChild = (parent: FilterOption) => {
    setAddModalParent(parent);
    setAddModalOpen(true);
  };

  // Handle add root
  const handleAddRoot = () => {
    setAddModalParent(null);
    setAddModalOpen(true);
  };

  // Handle filter update (refresh selection)
  const handleFilterUpdate = () => {
    // Re-select to refresh data
    if (selectedFilter && filters) {
      const updated = filters.find((f) => f._id === selectedFilter._id);
      setSelectedFilter(updated || null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-6">
      {/* Left Panel - Tree View */}
      <div className="flex w-96 flex-col rounded-xl border border-[#2d3748] bg-[#111827]">
        {/* Header */}
        <div className="border-b border-[#2d3748] p-4">
          <div className="flex items-center gap-2">
            <ListTree className="h-5 w-5 text-[#10b981]" />
            <h1 className="text-lg font-semibold text-[#e5e7eb]">Filters</h1>
          </div>
          <p className="mt-1 text-sm text-[#9ca3af]">
            Manage career path hierarchy
          </p>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search filters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#2d3748] bg-[#0b0f19] py-2 pl-9 pr-4 text-sm text-[#e5e7eb] placeholder-[#9ca3af] focus:border-[#10b981] focus:outline-none"
            />
          </div>
        </div>

        {/* Tree Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#10b981]" />
            </div>
          ) : filteredFilters && filteredFilters.length > 0 ? (
            <FilterTree
              filters={filteredFilters}
              selectedId={selectedFilter?._id}
              onSelect={setSelectedFilter}
              onAddChild={handleAddChild}
              onAddRoot={handleAddRoot}
            />
          ) : searchQuery ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[#9ca3af]">
                No filters match "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-[#9ca3af]">No filters yet.</p>
              <button
                onClick={handleAddRoot}
                className="mt-2 text-sm text-[#10b981] hover:underline"
              >
                Create your first qualification
              </button>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        {stats && (
          <div className="border-t border-[#2d3748] p-4">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="font-semibold text-[#e5e7eb]">{stats.total}</p>
                <p className="text-[#9ca3af]">Total</p>
              </div>
              <div>
                <p className="font-semibold text-emerald-400">{stats.active}</p>
                <p className="text-[#9ca3af]">Active</p>
              </div>
              <div>
                <p className="font-semibold text-amber-400">{stats.roles}</p>
                <p className="text-[#9ca3af]">Roles</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Inspector */}
      <div className="flex-1 rounded-xl border border-[#2d3748] bg-[#111827]">
        <FilterInspector
          filter={selectedFilter}
          onClose={() => setSelectedFilter(null)}
          onUpdate={handleFilterUpdate}
        />
      </div>

      {/* Add Filter Modal */}
      <AddFilterModal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setAddModalParent(null);
        }}
        onSuccess={() => {
          // Data will auto-refresh via Convex
        }}
        parent={addModalParent}
      />
    </div>
  );
}
