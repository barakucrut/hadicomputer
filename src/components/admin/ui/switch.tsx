"use client";

import * as React from "react";

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  className = "",
  id,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      id={id}
      onClick={() => onCheckedChange(!checked)}
      className={`admin-switch ${checked ? "checked" : ""} ${className}`.trim()}
    >
      <span className="admin-switch-thumb" />
    </button>
  );
}
