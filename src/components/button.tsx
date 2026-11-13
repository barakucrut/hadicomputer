import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

type Appearance = "primary" | "secondary" | "white" | "whatsapp";

export function Button({
  appearance = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { appearance?: Appearance }) {
  return (
    <button
      {...props}
      type={type}
      className={`button ${appearance} ${className}`}
    />
  );
}

export function ButtonLink({
  appearance = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { appearance?: Appearance }) {
  return <Link {...props} className={`button ${appearance} ${className}`} />;
}
