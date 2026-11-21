import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdminSession();
  if (!session?.tenantId) notFound();
  const product = await prisma.product.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
    include: {
      category: true,
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
      specs: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product) notFound();

  const serialized = {
    ...product,
    basePrice: product.basePrice !== null ? Number(product.basePrice) : null,
    originalPrice: product.originalPrice !== null ? Number(product.originalPrice) : null,
    variants: product.variants.map((v) => ({
      ...v,
      price: v.price !== null ? Number(v.price) : null,
      originalPrice: v.originalPrice !== null ? Number(v.originalPrice) : null,
    })),
  };

  return <ProductForm initialData={serialized} isEdit />;
}
