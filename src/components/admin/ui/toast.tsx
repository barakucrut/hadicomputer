"use client";

import * as React from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  // Function to show toast
  const showToast = React.useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    // Auto remove after 5 seconds (5000ms)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const success = React.useCallback(
    (message: string) => showToast(message, "success"),
    [showToast]
  );

  const error = React.useCallback(
    (message: string) => showToast(message, "error"),
    [showToast]
  );

  // Check for cross-page flash message in sessionStorage on mount or route changes
  React.useEffect(() => {
    function checkSessionFlash() {
      try {
        const stored = sessionStorage.getItem("admin_flash_message");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.message) {
            showToast(parsed.message, parsed.type || "success");
          }
          sessionStorage.removeItem("admin_flash_message");
        }
      } catch (e) {
        // ignore
      }
    }

    checkSessionFlash();
    window.addEventListener("focus", checkSessionFlash);
    const interval = setInterval(checkSessionFlash, 300);
    return () => {
      window.removeEventListener("focus", checkSessionFlash);
      clearInterval(interval);
    };
  }, [showToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const contextValue = React.useMemo(
    () => ({ showToast, success, error }),
    [showToast, success, error]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Flash Messages Container at Top of Screen */}
      {toasts.length > 0 && (
        <div className="admin-flash-container" role="region" aria-label="Notifikasi">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`admin-flash-message ${
                t.type === "success" ? "admin-flash-success" : "admin-flash-error"
              }`}
              role="alert"
            >
              {t.type === "success" ? (
                <CheckCircle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span>{t.message}</span>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="admin-flash-close"
                aria-label="Tutup"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Helper to set flash message before redirecting
export function setFlashMessage(message: string, type: ToastType = "success") {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(
        "admin_flash_message",
        JSON.stringify({ message, type })
      );
    } catch {
      // ignore
    }
  }
}
