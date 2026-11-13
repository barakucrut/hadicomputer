import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { inquiryType = "PRODUCT", productId, serviceId, variantName, priceAtInquiry } = body;

    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || undefined;
    const referrer = headersList.get("referer") || undefined;
    const forwardedFor = headersList.get("x-forwarded-for");
    const visitorIp = forwardedFor ? forwardedFor.split(",")[0].trim() : undefined;

    await prisma.inquiryLog.create({
      data: {
        inquiryType: inquiryType === "SERVICE" ? "SERVICE" : inquiryType === "GENERAL" ? "GENERAL" : "PRODUCT",
        productId: productId || undefined,
        serviceId: serviceId || undefined,
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
