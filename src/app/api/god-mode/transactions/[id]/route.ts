import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGodSession } from "@/lib/god-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getGodSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, amount, category, type, description, paymentMethod, tenantId, tenantName, date } = body;

    const updated = await prisma.platformTransaction.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(category !== undefined && { category }),
        ...(type !== undefined && { type }),
        ...(description !== undefined && { description: description || null }),
        ...(paymentMethod !== undefined && { paymentMethod: paymentMethod || "Transfer Manual" }),
        ...(tenantId !== undefined && { tenantId: tenantId || null }),
        ...(tenantName !== undefined && { tenantName: tenantName || null }),
        ...(date !== undefined && { date: new Date(date) }),
      },
    });

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error: any) {
    console.error("PATCH transaction error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui transaksi" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getGodSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.platformTransaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE transaction error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus transaksi" },
      { status: 500 }
    );
  }
}
