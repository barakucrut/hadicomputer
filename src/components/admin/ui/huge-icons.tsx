import * as React from "react";

interface HugeIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * Hugeicons-style Modern View / Eye Icon
 * Soft curved almond shape with centered circular pupil
 */
export function HugeIconEye({ size = 16, className = "", ...props }: HugeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M2.5 12c2.2-4.8 6.1-7.5 9.5-7.5s7.3 2.7 9.5 7.5c-2.2 4.8-6.1 7.5-9.5 7.5s-7.3-2.7-9.5-7.5z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

/**
 * Hugeicons-style Modern Edit / Pencil Icon
 * 45° angled sleek body with chisel tip and eraser seam
 */
export function HugeIconEdit({ size = 16, className = "", ...props }: HugeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M16.5 5.5l2 2m-.6-3.8a2.121 2.121 0 013 3L7.8 19.8l-4.8 1 1-4.8L17.9 3.7z" />
    </svg>
  );
}

/**
 * Hugeicons-style Modern Trash / Delete Icon
 * Floating rounded lid with center handle, tapered bin body, and 2 minimal ribs
 */
export function HugeIconTrash({ size = 16, className = "", ...props }: HugeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M4 6h16" />
      <path d="M9 6V4.2c0-.7.5-1.2 1.2-1.2h3.6c.7 0 1.2.5 1.2 1.2V6" />
      <path d="M18.2 6l-.8 12.8c-.1 1.2-1 2.2-2.2 2.2H8.8c-1.2 0-2.1-1-2.2-2.2L5.8 6" />
      <path d="M10 10.5v5.5" />
      <path d="M14 10.5v5.5" />
    </svg>
  );
}

/**
 * Hugeicons-style External Link / Arrow Up-Right in Window
 */
export function HugeIconExternal({ size = 16, className = "", ...props }: HugeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M13.5 4.5H19.5V10.5" />
      <path d="M10 14L19.5 4.5" />
      <path d="M19.5 14V18.5C19.5 19.6 18.6 20.5 17.5 20.5H5.5C4.4 20.5 3.5 19.6 3.5 18.5V6.5C3.5 5.4 4.4 4.5 5.5 4.5H10" />
    </svg>
  );
}
