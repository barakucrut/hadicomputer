"use client";

import * as React from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { HugeIconTrash } from "@/components/admin/ui/huge-icons";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Ya, Hapus",
  cancelLabel = "Batal",
  variant = "destructive",
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange, loading]);

  if (!open) return null;

  return (
    <div className="admin-dialog-root" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      {/* Backdrop with 8px blur */}
      <div
        className="admin-dialog-backdrop"
        onClick={() => !loading && onOpenChange(false)}
      />

      {/* Modal Dialog Card */}
      <div className="admin-dialog-card">
        <button
          type="button"
          onClick={() => !loading && onOpenChange(false)}
          className="admin-dialog-close-btn"
          aria-label="Tutup"
        >
          <X size={16} />
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              minWidth: "42px",
              borderRadius: "10px",
              backgroundColor: "#fee2e2",
              color: "var(--red)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HugeIconTrash size={20} />
          </div>

          <div style={{ flex: 1 }}>
            <h3
              id="confirm-dialog-title"
              style={{
                margin: "0 0 6px 0",
                fontSize: "16px",
                fontWeight: 800,
                color: "var(--ink)",
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "var(--muted)",
                lineHeight: "1.5",
              }}
            >
              {description}
            </p>
          </div>
        </div>

        {/* Footer with 50% width buttons and 16px gap */}
        <div className="admin-dialog-footer">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={variant}
            disabled={loading}
            onClick={async () => {
              await onConfirm();
              onOpenChange(false);
            }}
          >
            {loading ? "Menghapus..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
