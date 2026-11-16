import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGodSession } from "@/lib/god-auth";

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
