import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

const QuestionSchema = z.object({
  classId: z.string(),
  prompt: z.string().min(5),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctOption: z.enum(["A", "B", "C", "D"])
});

export async function POST(req: Request) {
  try {
    const teacher = await requireTeacher();
    const body = QuestionSchema.parse(await req.json());

    const targetClass = await prisma.class.findFirst({
      where: {
        id: body.classId,
        teacherId: teacher.id
      }
    });

    if (!targetClass) {
      return NextResponse.json(
        { error: "Class not found." },
        { status: 404 }
      );
    }

    const question = await prisma.question.create({
      data: body
    });

    return NextResponse.json({
      success: true,
      question
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to create question." },
      { status: 400 }
    );
  }
}