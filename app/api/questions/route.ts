import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export const runtime = "nodejs";

const QuestionSchema = z.object({
  classId: z.string().min(1),
  questionSetId: z.string().min(1),
  prompt: z.string().trim().min(5),
  optionA: z.string().trim().min(1),
  optionB: z.string().trim().min(1),
  optionC: z.string().trim().min(1),
  optionD: z.string().trim().min(1),
  correctOption: z.enum(["A", "B", "C", "D"])
});

export async function POST(req: Request) {
  try {
    const teacher = await requireTeacher();
    const body = QuestionSchema.parse(await req.json());

    const questionSet = await prisma.questionSet.findFirst({
      where: {
        id: body.questionSetId,
        classId: body.classId,
        class: {
          teacherId: teacher.id
        }
      }
    });

    if (!questionSet) {
      return NextResponse.json(
        { error: "Question set not found or does not belong to this class." },
        { status: 404 }
      );
    }

    if (!questionSet.isActive) {
      return NextResponse.json(
        { error: "Cannot add MCQs to an inactive question set." },
        { status: 400 }
      );
    }

    const question = await prisma.question.create({
      data: {
        classId: body.classId,
        questionSetId: body.questionSetId,
        prompt: body.prompt,
        optionA: body.optionA,
        optionB: body.optionB,
        optionC: body.optionC,
        optionD: body.optionD,
        correctOption: body.correctOption
      }
    });

    return NextResponse.json({
      success: true,
      question
    });
  } catch (error) {
    console.error("CREATE_QUESTION_ERROR:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid question input." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Unable to create question."
      },
      { status: 400 }
    );
  }
}