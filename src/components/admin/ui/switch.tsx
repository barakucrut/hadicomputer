"use client";

import * as React from "react";

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  className = "",
  id,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      id={id}
      onClick={() => onCheckedChange(!checked)}
      className={`admin-switch ${checked ? "is-checked" : ""} ${className}`}
    >
      <span className="admin-switch-thumb" />
    </button>
  );
}
