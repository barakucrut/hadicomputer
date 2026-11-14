import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Headphones,
  Laptop,
  Smartphone,
  Tablet,
  PackageSearch,
  PcCase,
  Keyboard,
  Mouse,
  HardDrive,
  Cpu,
  Printer,
  Watch,
  Speaker,
  Tv,
  Camera,
  Wifi,
  Package,
  ShoppingCart,
  Tag,
  Monitor,
  BriefcaseBusiness,
  GraduationCap,
  Palette,
  Gamepad2,
  Home,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

export * from "./ui/input";
export * from "./ui/select";
export * from "./ui/label";
export * from "./ui/slider";


export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`container ${className}`}>{children}</div>;
}
export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkText = "Lihat semua",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {linkText}
          <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}
export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <Link href="/">Beranda</Link>
      {items.map((item, i) => (
        <span key={i}>
          <ChevronRight size={13} />
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
export function CategoryIcon({
  name,
  size = 26,
}: {
  name: string;
  size?: number;
}) {
  const Icon =
    {
      pc: PcCase,
      laptop: Laptop,
      smartphone: Smartphone,
      tablet: Tablet,
      headphones: Headphones,
      keyboard: Keyboard,
      mouse: Mouse,
      "hard-drive": HardDrive,
      storage: HardDrive,
      cpu: Cpu,
      printer: Printer,
      watch: Watch,
      speaker: Speaker,
      tv: Tv,
      monitor: Monitor,
      camera: Camera,
      wifi: Wifi,
      package: Package,
      "shopping-cart": ShoppingCart,
      sembako: ShoppingCart,
      tag: Tag,
      briefcase: BriefcaseBusiness,
      "graduation-cap": GraduationCap,
      kuliah: GraduationCap,
      kerja: BriefcaseBusiness,
      palette: Palette,
      kreatif: Palette,
      gamepad: Gamepad2,
      gaming: Gamepad2,
      home: Home,
      harian: Home,
      sparkles: Sparkles,
    }[name] ?? Package;
  return <Icon size={size} strokeWidth={1.5} />;
}
export function EmptyState({
  title = "Belum ada produk yang cocok",
  description = "Coba kata kunci lain atau sesuaikan filter pencarianmu.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      <PackageSearch size={48} strokeWidth={1.2} />
      <h2>{title}</h2>
      <p>{description}</p>
      <Link href="/katalog" className="button secondary">
        Lihat semua produk
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
