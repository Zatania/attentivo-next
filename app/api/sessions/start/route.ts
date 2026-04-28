import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { startClassSession } from "@/lib/session-controller";

const StartSessionSchema = z.object({
  classId: z.string().min(1),
  intervalSeconds: z.number().int().min(60).max(1800).default(300)
});

export async function POST(req: Request) {
  try {
    const teacher = await requireTeacher();
    const body = StartSessionSchema.parse(await req.json());

    const session = await startClassSession({
      prisma,
      teacherId: teacher.id,
      classId: body.classId,
      intervalSeconds: body.intervalSeconds
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