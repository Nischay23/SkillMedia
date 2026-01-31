"use client";

import { useState, useMemo } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Check, ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  _id: Id<"FilterOption">;
  name: string;
  type: string;
  parentId?: Id<"FilterOption">;
  isActive?: boolean;
}

interface FilterSelectorProps {
  filters: FilterOption[];
  selectedIds: Id<"FilterOption">[];
  onChange: (ids: Id<"FilterOption">[]) => void;
  placeholder?: string;
}

export function FilterSelector({
  filters,
  selectedIds,
  onChange,
  placeholder = "Select filters...",
}: FilterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build hierarchical tree structure
  const filterTree = useMemo(() => {
    const rootFilters = filters.filter((f) => !f.parentId);
    
    const getChildren = (parentId: Id<"FilterOption">): FilterOption[] => {
      return filters.filter((f) => f.parentId === parentId);
    };

    return { rootFilters, getChildren };
  }, [filters]);

  // Filter by search
  const filteredFilters = useMemo(() => {
    if (!search) return filters;
    const query = search.toLowerCase();
    return filters.filter((f) => f.name.toLowerCase().includes(query));
  }, [filters, search]);

  // Get selected filter names for display
  const selectedNames = useMemo(() => {
    return selectedIds
      .map((id) => filters.find((f) => f._id === id)?.name)
      .filter(Boolean);
  }, [selectedIds, filters]);

  const toggleFilter = (id: Id<"FilterOption">) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const removeFilter = (id: Id<"FilterOption">) => {
    onChange(selectedIds.filter((i) => i !== id));
  };

  const clearAll = () => {
    onChange([]);
  };

  // Render a filter node with its children
  const renderFilterNode = (filter: FilterOption, depth: number = 0) => {
    const children = filterTree.getChildren(filter._id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(filter._id);
    const isSelected = selectedIds.includes(filter._id);

    // If searching, only show matching filters
    if (search && !filter.name.toLowerCase().includes(search.toLowerCase())) {
      // But check if any children match
      const hasMatchingChild = children.some((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      );
      if (!hasMatchingChild) return null;
    }

    return (
      <div key={filter._id}>
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#2d3748]",
            isSelected && "bg-[#10b981]/10"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {/* Expand/Collapse button */}
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(filter._id);
              }}
              className="shrink-0 rounded p-0.5 text-[#9ca3af] hover:bg-[#2d3748] hover:text-[#e5e7eb]"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          {/* Checkbox */}
          <button
            type="button"
            onClick={() => toggleFilter(filter._id)}
            className={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
              isSelected
                ? "border-[#10b981] bg-[#10b981] text-[#0b0f19]"
                : "border-[#2d3748] bg-transparent hover:border-[#10b981]"
            )}
          >
            {isSelected && <Check className="h-3 w-3" />}
          </button>

          {/* Label */}
          <button
            type="button"
            onClick={() => toggleFilter(filter._id)}
            className="flex-1 text-left text-sm text-[#e5e7eb]"
          >
            {filter.name}
          </button>

          {/* Type badge */}
          <span className="text-xs text-[#9ca3af] capitalize">
            {filter.type}
          </span>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {children.map((child) => renderFilterNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left transition-colors",
          isOpen
            ? "border-[#10b981] ring-1 ring-[#10b981]"
            : "border-[#2d3748] hover:border-[#10b981]/50",
          "bg-[#0b0f19]"
        )}
      >
        <span className={selectedIds.length > 0 ? "text-[#e5e7eb]" : "text-[#9ca3af]"}>
          {selectedIds.length > 0
            ? `${selectedIds.length} filter${selectedIds.length > 1 ? "s" : ""} selected`
            : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[#9ca3af] transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Selected Tags */}
      {selectedIds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedNames.map((name, index) => (
            <span
              key={selectedIds[index]}
              className="inline-flex items-center gap-1 rounded-full bg-[#10b981]/10 px-2.5 py-1 text-xs font-medium text-[#10b981]"
            >
              {name}
              <button
                type="button"
                onClick={() => removeFilter(selectedIds[index])}
                className="rounded-full p-0.5 hover:bg-[#10b981]/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selectedIds.length > 1 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-[#9ca3af] hover:text-[#e5e7eb]"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute z-20 mt-2 w-full rounded-lg border border-[#2d3748] bg-[#111827] shadow-xl">
            {/* Search */}
            <div className="border-b border-[#2d3748] p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  type="text"
                  placeholder="Search filters..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-[#2d3748] bg-[#0b0f19] py-2 pl-9 pr-4 text-sm text-[#e5e7eb] placeholder-[#9ca3af] focus:border-[#10b981] focus:outline-none"
                />
              </div>
            </div>

            {/* Filter List */}
            <div className="max-h-64 overflow-y-auto p-2">
              {search ? (
                // Flat list when searching
                filteredFilters.length > 0 ? (
                  filteredFilters.map((filter) => (
                    <div
                      key={filter._id}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#2d3748]",
                        selectedIds.includes(filter._id) && "bg-[#10b981]/10"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFilter(filter._id)}
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                          selectedIds.includes(filter._id)
                            ? "border-[#10b981] bg-[#10b981] text-[#0b0f19]"
                            : "border-[#2d3748] bg-transparent hover:border-[#10b981]"
                        )}
                      >
                        {selectedIds.includes(filter._id) && <Check className="h-3 w-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFilter(filter._id)}
                        className="flex-1 text-left text-sm text-[#e5e7eb]"
                      >
                        {filter.name}
                      </button>
                      <span className="text-xs text-[#9ca3af] capitalize">
                        {filter.type}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-[#9ca3af]">
                    No filters found
                  </p>
                )
              ) : (
                // Hierarchical tree when not searching
                filterTree.rootFilters.map((filter) => renderFilterNode(filter))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
