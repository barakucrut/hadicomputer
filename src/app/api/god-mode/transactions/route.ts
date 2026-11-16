import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGodSession } from "@/lib/god-auth";

export async function GET(request: Request) {
  try {
    const session = await getGodSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "INCOME" | "EXPENSE" | null
    const search = searchParams.get("search");

    const where: any = {};
    if (type && (type === "INCOME" || type === "EXPENSE")) {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { tenantName: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const transactions = await prisma.platformTransaction.findMany({
      where,
      orderBy: { date: "desc" },
    });

    // Compute aggregated stats
    const all = await prisma.platformTransaction.findMany();
    const totalIncome = all
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = all
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalIncome - totalExpense;

    return NextResponse.json({
      success: true,
      transactions,
      stats: {
        totalIncome,
        totalExpense,
        netProfit,
        count: all.length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/god-mode/transactions error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memuat transaksi" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getGodSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      category,
      title,
      amount,
      date,
      description,
      tenantId,
      tenantName,
      paymentMethod,
    } = body;

    if (!type || !title || !amount || !category) {
      return NextResponse.json(
        { error: "Tipe, Judul, Kategori, dan Nominal wajib diisi" },
        { status: 400 }
      );
    }

    const transaction = await prisma.platformTransaction.create({
      data: {
        type,
        category,
        title,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        description: description || null,
        tenantId: tenantId || null,
        tenantName: tenantName || null,
        paymentMethod: paymentMethod || "Transfer Manual",
        status: "SUCCESS",
      },
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error: any) {
    console.error("POST /api/god-mode/transactions error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mencatat transaksi" },
      { status: 500 }
    );
  }
}
