"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Bot,
  Settings2,
  Power,
  PowerOff,
  Save,
  MessageSquare,
  Users,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Sliders,
  RotateCcw,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function AIConfigPage() {
  const globalSettings = useQuery(api.aiConfig.getGlobalSettings);
  const groupsWithSettings = useQuery(api.aiConfig.getGroupsWithAISettings);
  const usageStats = useQuery(api.aiConfig.getAIUsageStats);

  const updateGlobalSettings = useMutation(api.aiConfig.updateGlobalSettings);
  const updateGroupSettings = useMutation(api.aiConfig.updateGroupSettings);

  // Local state for form
  const [isEnabled, setIsEnabled] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [maxQueries, setMaxQueries] = useState(10);
  const [temperature, setTemperature] = useState(0.7);
  const [model, setModel] = useState("gemini-2.5-flash");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Initialize form with global settings
  useEffect(() => {
    if (globalSettings) {
      setIsEnabled(globalSettings.isEnabled ?? true);
      setSystemPrompt(
        globalSettings.systemPrompt ||
          "You are a helpful career guidance assistant for Indian students. Answer questions about career paths, preparation strategies, relevant exams, and job prospects. Be encouraging and informative."
      );
      setMaxQueries(globalSettings.maxQueriesPerDay || 10);
      setTemperature(globalSettings.temperature || 0.7);
      setModel(globalSettings.model || "gemini-2.5-flash");
    }
  }, [globalSettings]);

  const handleSaveGlobal = async () => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      await updateGlobalSettings({
        isEnabled,
        systemPrompt,
        maxQueriesPerDay: maxQueries,
        temperature,
        model,
      });
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage("Failed to save settings");
    }
    setIsSaving(false);
  };

  const handleToggleGroup = async (
    groupId: Id<"groups">,
    currentEnabled: boolean
  ) => {
    try {
      await updateGroupSettings({
        groupId,
        isEnabled: !currentEnabled,
      });
    } catch (error) {
      console.error("Failed to toggle group AI:", error);
    }
  };

  const handleResetPrompt = () => {
    setSystemPrompt(
      "You are a helpful career guidance assistant for Indian students. Answer questions about career paths, preparation strategies, relevant exams, and job prospects. Be encouraging and informative."
    );
  };

  const isLoading =
    globalSettings === undefined ||
    groupsWithSettings === undefined ||
    usageStats === undefined;

  // Format date for chart
  const formatDateString = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const chartData =
    usageStats?.dailyUsage?.map((d: { date: string; count: number }) => ({
      name: formatDateString(d.date),
      queries: d.count,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            AI Configuration
          </h1>
          <p className="mt-1 text-muted-foreground">
            Configure AI chatbot settings for groups
          </p>
        </div>
        {saveMessage && (
          <div
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              saveMessage.includes("success")
                ? "bg-emerald-500/20 text-emerald-500"
                : "bg-red-500/20 text-red-500"
            }`}
          >
            {saveMessage}
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : usageStats?.totalConversations ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Total AI Queries</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : usageStats?.todayConversations ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Today's Queries</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <RefreshCw className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : usageStats?.weekConversations ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Users className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : usageStats?.uniqueUsers ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Unique AI Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Usage Chart */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          AI Usage (Last 7 Days)
        </h2>
        <div className="h-64">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="queries"
                  stroke="#6C5DD3"
                  strokeWidth={2}
                  dot={{ fill: "#6C5DD3" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Global Settings */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Global AI Settings
            </h3>
            <p className="text-sm text-muted-foreground">
              Default settings for all groups
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">AI Chatbot</p>
                <p className="text-sm text-muted-foreground">
                  Enable AI assistant in groups
                </p>
              </div>
              <button
                onClick={() => setIsEnabled(!isEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isEnabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* System Prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium text-foreground">
                  System Prompt
                </label>
                <button
                  onClick={handleResetPrompt}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              </div>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Enter AI system prompt..."
                className="input-field min-h-[120px] resize-none"
              />
            </div>

            {/* Max Queries */}
            <div>
              <label className="font-medium text-foreground mb-2 block">
                Max Queries per Day (per user)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={maxQueries}
                  onChange={(e) => setMaxQueries(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <span className="text-lg font-bold text-primary w-12 text-right">
                  {maxQueries}
                </span>
              </div>
            </div>

            {/* Temperature */}
            <div>
              <label className="font-medium text-foreground mb-2 block">
                Temperature (Creativity)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <span className="text-lg font-bold text-primary w-12 text-right">
                  {temperature}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lower = more focused, Higher = more creative
              </p>
            </div>

            {/* Model */}
            <div>
              <label className="font-medium text-foreground mb-2 block">
                AI Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="input-field"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Advanced)</option>
              </select>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveGlobal}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? "Saving..." : "Save Global Settings"}
            </button>
          </div>
        </div>

        {/* Per-Group Settings */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI per Group
            </h3>
            <p className="text-sm text-muted-foreground">
              Enable/disable AI for specific groups
            </p>
          </div>

          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-6 w-11 animate-pulse rounded-full bg-muted" />
                </div>
              ))
            ) : groupsWithSettings?.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground">
                No groups created yet
              </div>
            ) : (
              groupsWithSettings?.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {group.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {group.memberCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {group.conversationCount} queries
                      </span>
                      {group.customPrompt && (
                        <span className="flex items-center gap-1 text-primary">
                          <Sliders className="h-3 w-3" />
                          Custom
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleToggleGroup(
                        group.id as Id<"groups">,
                        group.aiEnabled
                      )
                    }
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      group.aiEnabled
                        ? "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {group.aiEnabled ? (
                      <>
                        <Power className="h-3 w-3" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <PowerOff className="h-3 w-3" />
                        Disabled
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
