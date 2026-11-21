import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { resolveStorefrontTenant } from "@/lib/tenant-resolver";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { inquiryType = "PRODUCT", productId, serviceId, variantName, priceAtInquiry } = body;

    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || undefined;
    const referrer = headersList.get("referer") || undefined;
    const forwardedFor = headersList.get("x-forwarded-for");
    const visitorIp = forwardedFor ? forwardedFor.split(",")[0].trim() : undefined;

    // Tenant diambil dari produk/layanan itu sendiri (tidak percaya input klien);
    // inquiry umum memakai tenant storefront yang sedang dibuka.
    let tenantId: string | null = null;
    let validProductId: string | undefined;
    let validServiceId: string | undefined;
    if (productId) {
      const p = await prisma.product.findUnique({ where: { id: String(productId) }, select: { id: true, tenantId: true } });
      if (p) { tenantId = p.tenantId; validProductId = p.id; }
    } else if (serviceId) {
      const sv = await prisma.service.findUnique({ where: { id: String(serviceId) }, select: { id: true, tenantId: true } });
      if (sv) { tenantId = sv.tenantId; validServiceId = sv.id; }
    }
    if (!tenantId) {
      const storefront = await resolveStorefrontTenant();
      tenantId = storefront.id !== "default" ? storefront.id : null;
    }

    await prisma.inquiryLog.create({
      data: {
        tenantId,
        inquiryType: inquiryType === "SERVICE" ? "SERVICE" : inquiryType === "GENERAL" ? "GENERAL" : "PRODUCT",
        productId: validProductId,
        serviceId: validServiceId,
        variantName: variantName || undefined,
        priceAtInquiry: priceAtInquiry ? BigInt(priceAtInquiry) : undefined,
        visitorIp: visitorIp ? visitorIp.slice(0, 50) : undefined,
        userAgent: userAgent ? userAgent.slice(0, 255) : undefined,
        referrer: referrer ? referrer.slice(0, 255) : undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Inquiry track error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
