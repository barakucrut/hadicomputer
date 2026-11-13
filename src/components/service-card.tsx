import Link from "next/link";
import { ArrowUpRight, Wrench, Cpu } from "lucide-react";
import type { Service } from "@/lib/types";

export function ServiceCard({ service }: { service: Service }) {
  const Icon = service.slug === "rakit-pc" ? Cpu : Wrench;
  return (
    <Link className="service-card" href={`/layanan/${service.slug}`}>
      <span className="service-icon">
        <Icon size={28} strokeWidth={1.5} />
      </span>
      <div>
        <h3>{service.name}</h3>
        <p>{service.summary}</p>
        <span className="text-link">
          Kenali layanannya
          <ArrowUpRight size={16} />
        </span>
      </div>
      <ArrowUpRight className="service-corner" size={20} />
    </Link>
  );
}
