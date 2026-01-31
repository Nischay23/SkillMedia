"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

// Filter type from Convex
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

interface FilterTreeNodeProps {
  filter: FilterOption;
  allFilters: FilterOption[];
  depth?: number;
  selectedId?: Id<"FilterOption">;
  onSelect: (filter: FilterOption) => void;
  onAddChild: (parent: FilterOption) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (id: string) => void;
}

// Type colors for visual distinction
const typeColors: Record<string, string> = {
  qualification: "text-purple-400",
  category: "text-blue-400",
  sector: "text-cyan-400",
  subSector: "text-teal-400",
  branch: "text-emerald-400",
  role: "text-amber-400",
};

const typeIcons: Record<string, typeof Folder> = {
  qualification: Folder,
  category: Folder,
  sector: Folder,
  subSector: FolderOpen,
  branch: FileText,
  role: Circle,
};

export function FilterTreeNode({
  filter,
  allFilters,
  depth = 0,
  selectedId,
  onSelect,
  onAddChild,
  expandedNodes,
  onToggleExpand,
}: FilterTreeNodeProps) {
  // Get children of this node
  const children = allFilters.filter((f) => f.parentId === filter._id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedNodes.has(filter._id);
  const isSelected = selectedId === filter._id;
  const isInactive = filter.isActive === false;

  const Icon = typeIcons[filter.type] || FileText;
  const colorClass = typeColors[filter.type] || "text-[#9ca3af]";

  return (
    <div>
      {/* Node */}
      <div
        className={cn(
          "group flex items-center gap-1 rounded-lg py-1.5 pr-2 transition-colors",
          isSelected
            ? "bg-[#10b981]/10 text-[#e5e7eb]"
            : "text-[#9ca3af] hover:bg-[#1f2937] hover:text-[#e5e7eb]",
          isInactive && "opacity-50"
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(filter._id);
          }}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors",
            hasChildren
              ? "hover:bg-[#2d3748]"
              : "cursor-default opacity-0"
          )}
          disabled={!hasChildren}
        >
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          )}
        </button>

        {/* Icon */}
        <Icon className={cn("h-4 w-4 shrink-0", colorClass)} />

        {/* Name */}
        <button
          onClick={() => onSelect(filter)}
          className="flex-1 truncate text-left text-sm font-medium"
        >
          {filter.name}
        </button>

        {/* Type Badge */}
        <span className={cn("text-xs capitalize opacity-60", colorClass)}>
          {filter.type}
        </span>

        {/* Add Child Button (visible on hover) */}
        {filter.type !== "role" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(filter);
            }}
            className="ml-1 hidden rounded p-1 text-[#9ca3af] transition-colors hover:bg-[#2d3748] hover:text-[#10b981] group-hover:block"
            title="Add child"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        )}

        {/* Inactive badge */}
        {isInactive && (
          <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs text-red-400">
            Inactive
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {children
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((child) => (
              <FilterTreeNode
                key={child._id}
                filter={child}
                allFilters={allFilters}
                depth={depth + 1}
                selectedId={selectedId}
                onSelect={onSelect}
                onAddChild={onAddChild}
                expandedNodes={expandedNodes}
                onToggleExpand={onToggleExpand}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// Root tree component that renders all root nodes
interface FilterTreeProps {
  filters: FilterOption[];
  selectedId?: Id<"FilterOption">;
  onSelect: (filter: FilterOption) => void;
  onAddChild: (parent: FilterOption) => void;
  onAddRoot: () => void;
}

export function FilterTree({
  filters,
  selectedId,
  onSelect,
  onAddChild,
  onAddRoot,
}: FilterTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    // Initially expand root nodes
    const roots = filters.filter((f) => !f.parentId);
    return new Set(roots.map((r) => r._id));
  });

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedNodes(new Set(filters.map((f) => f._id)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Get root filters (no parent)
  const rootFilters = filters.filter((f) => !f.parentId);

  return (
    <div className="space-y-2">
      {/* Tree Controls */}
      <div className="flex items-center justify-between border-b border-[#2d3748] pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="rounded px-2 py-1 text-xs text-[#9ca3af] transition-colors hover:bg-[#2d3748] hover:text-[#e5e7eb]"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="rounded px-2 py-1 text-xs text-[#9ca3af] transition-colors hover:bg-[#2d3748] hover:text-[#e5e7eb]"
          >
            Collapse All
          </button>
        </div>
        <button
          onClick={onAddRoot}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#10b981] transition-colors hover:bg-[#10b981]/10"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Root
        </button>
      </div>

      {/* Tree Content */}
      <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
        {rootFilters.length > 0 ? (
          rootFilters
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((filter) => (
              <FilterTreeNode
                key={filter._id}
                filter={filter}
                allFilters={filters}
                selectedId={selectedId}
                onSelect={onSelect}
                onAddChild={onAddChild}
                expandedNodes={expandedNodes}
                onToggleExpand={toggleExpand}
              />
            ))
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-[#9ca3af]">No filters yet.</p>
            <button
              onClick={onAddRoot}
              className="mt-2 text-sm text-[#10b981] hover:underline"
            >
              Create your first qualification
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
