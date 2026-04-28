import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      database: "connected"
    });
  } catch (error) {
    console.error("HEALTH_CHECK_ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        database: "disconnected",
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Database connection failed."
      },
      { status: 500 }
    );
  }
}