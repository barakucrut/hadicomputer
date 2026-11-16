import { NextResponse } from "next/server";
import { GOD_COOKIE_NAME } from "@/lib/god-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(GOD_COOKIE_NAME);
  return response;
}
