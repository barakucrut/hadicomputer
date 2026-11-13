import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const variantClass =
      variant === "default"
        ? "admin-btn-primary"
        : variant === "destructive"
        ? "admin-btn-destructive"
        : `admin-btn-${variant}`;

    const sizeClass = `admin-btn-${size}`;

    return (
      <button
        ref={ref}
        className={`admin-btn ${variantClass} ${sizeClass} ${className}`.trim()}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
