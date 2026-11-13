"use client";

import * as React from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="admin-dialog-root">
      {/* Backdrop with 8px blur */}
      <div
        className="admin-dialog-backdrop"
        onClick={() => onOpenChange(false)}
      />
      {/* Modal Dialog Card */}
      <div className="admin-dialog-card">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="admin-dialog-close-btn"
          aria-label="Tutup"
        >
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function DialogHeader({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col space-y-1.5 text-left mb-4 border-b border-[#f1f3ed] pb-3 ${className}`}
      {...props}
    />
  );
}

export function DialogTitle({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={`text-lg font-bold leading-none tracking-tight text-[#111413] ${className}`}
      {...props}
    />
  );
}

export function DialogDescription({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm text-[#525854] ${className}`} {...props} />;
}

export function DialogFooter({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`admin-dialog-footer ${className}`.trim()}
      {...props}
    />
  );
}
