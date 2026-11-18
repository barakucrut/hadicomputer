"use client";

import * as React from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** Extra classes for the dialog card (e.g. width overrides). */
  className?: string;
  /** Inline style for the dialog card, e.g. { maxWidth: 760 }. */
  style?: React.CSSProperties;
  /** When false, backdrop click, Escape and the close button are ignored (e.g. while saving). */
  dismissible?: boolean;
}

export function Dialog({
  open,
  onOpenChange,
  children,
  className = "",
  style,
  dismissible = true,
}: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange, dismissible]);

  if (!open) return null;

  return (
    <div className="admin-dialog-root" role="dialog" aria-modal="true">
      {/* Backdrop with 8px blur */}
      <div
        className="admin-dialog-backdrop"
        onClick={() => dismissible && onOpenChange(false)}
      />
      {/* Modal Dialog Card */}
      <div className={`admin-dialog-card ${className}`.trim()} style={style}>
        <button
          type="button"
          onClick={() => dismissible && onOpenChange(false)}
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
      className={`flex flex-col space-y-1.5 text-left mb-4 border-b border-[#e5e3dd] pb-4 pr-10 ${className}`}
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
