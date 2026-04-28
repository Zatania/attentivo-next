import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { startClassSession } from "@/lib/session-controller";

export const runtime = "nodejs";

const StartSessionSchema = z.object({
  classId: z.string().min(1),
  questionSetId: z.string().min(1),
  intervalSeconds: z.number().int().min(30).max(1800).default(300),
  plannedDurationMinutes: z.number().int().min(5).max(240).default(120)
});

export async function POST(req: Request) {
  try {
    const teacher = await requireTeacher();
    const body = StartSessionSchema.parse(await req.json());

    const session = await startClassSession({
      prisma,
      teacherId: teacher.id,
      classId: body.classId,
      questionSetId: body.questionSetId,
      intervalSeconds: body.intervalSeconds,
      plannedDurationMinutes: body.plannedDurationMinutes
    });

    return NextResponse.json({
      success: true,
      session
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start session."
      },
      { status: 400 }
    );
  }
}