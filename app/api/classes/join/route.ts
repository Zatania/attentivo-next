import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth";

const JoinClassSchema = z.object({
  classCode: z.string().min(4)
});

export async function POST(req: Request) {
  try {
    const student = await requireStudent();
    const body = JoinClassSchema.parse(await req.json());

    const targetClass = await prisma.class.findUnique({
      where: {
        classCode: body.classCode.trim().toUpperCase()
      }
    });

    if (!targetClass) {
      return NextResponse.json(
        { error: "Invalid class code." },
        { status: 404 }
      );
    }

    const enrollment = await prisma.enrollment.upsert({
      where: {
        classId_studentId: {
          classId: targetClass.id,
          studentId: student.id
        }
      },
      update: {},
      create: {
        classId: targetClass.id,
        studentId: student.id
      }
    });

    return NextResponse.json({
      success: true,
      enrollment
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to join class." },
      { status: 400 }
    );
  }
}