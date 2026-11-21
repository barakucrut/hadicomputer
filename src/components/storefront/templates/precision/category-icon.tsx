import {
  Camera,
  Cpu,
  Droplet,
  Gamepad2,
  HardDrive,
  Headphones,
  Laptop,
  Monitor,
  Mouse,
  Package,
  PcCase,
  Printer,
  Projector,
  Smartphone,
  Tablet,
  Watch,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { categoryIconKey, type CategoryIconKey } from "./model";

const ICONS: Record<CategoryIconKey, LucideIcon> = {
  laptop: Laptop,
  desktop: PcCase,
  monitor: Monitor,
  printer: Printer,
  ink: Droplet,
  tablet: Tablet,
  phone: Smartphone,
  watch: Watch,
  projector: Projector,
  storage: HardDrive,
  network: Wifi,
  audio: Headphones,
  camera: Camera,
  gaming: Gamepad2,
  component: Cpu,
  accessory: Mouse,
  package: Package,
};

/** Ikon garis untuk kategori (dipilih otomatis dari nama kategori). */
export function CategoryIcon({ name, stored, size = 20, className = "" }: { name: string; stored?: string | null; size?: number; className?: string }) {
  const Icon = ICONS[categoryIconKey(name, stored)];
  return <Icon size={size} strokeWidth={1.6} className={className} aria-hidden />;
}
