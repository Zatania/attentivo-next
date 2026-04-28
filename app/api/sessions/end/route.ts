import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { endClassSession } from "@/lib/session-controller";

const EndSessionSchema = z.object({
  sessionId: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const teacher = await requireTeacher();
    const body = EndSessionSchema.parse(await req.json());

    const result = await endClassSession({
      prisma,
      teacherId: teacher.id,
      sessionId: body.sessionId
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to end session."
      },
      { status: 400 }
    );
  }
}