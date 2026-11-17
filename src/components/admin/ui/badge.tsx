import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" | "info" | "purple";
}

export function Badge({
  className = "",
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "admin-badge-default",
    secondary: "admin-badge-secondary",
    success: "admin-badge-success",
    warning: "admin-badge-warning",
    destructive: "admin-badge-danger",
    outline: "admin-badge-secondary",
    info: "admin-badge-info",
    purple: "admin-badge-purple",
  };

  return (
    <div
      className={`admin-badge ${variantStyles[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
