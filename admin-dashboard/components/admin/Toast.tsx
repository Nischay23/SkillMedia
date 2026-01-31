"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  const icons: Record<ToastType, typeof CheckCircle> = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const styles: Record<ToastType, string> = {
    success: "border-emerald-500/50 bg-emerald-500/10",
    error: "border-red-500/50 bg-red-500/10",
    info: "border-blue-500/50 bg-blue-500/10",
    warning: "border-amber-500/50 bg-amber-500/10",
  };

  const iconStyles: Record<ToastType, string> = {
    success: "text-emerald-400",
    error: "text-red-400",
    info: "text-blue-400",
    warning: "text-amber-400",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm ${styles[toast.type]} animate-in slide-in-from-right`}
            style={{
              animation: "slideIn 0.3s ease-out",
            }}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 ${iconStyles[toast.type]}`} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[#e5e7eb]">{toast.title}</p>
              {toast.description && (
                <p className="mt-1 text-sm text-[#9ca3af]">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 rounded p-1 text-[#9ca3af] transition-colors hover:bg-[#2d3748] hover:text-[#e5e7eb]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
