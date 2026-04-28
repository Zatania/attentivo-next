import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export const runtime = "nodejs";

const CreateQuestionSetSchema = z.object({
  classId: z.string().min(1),
  title: z.string().trim().min(2, "Question set title is required."),
  description: z.string().trim().optional()
});

export async function POST(req: Request) {
  try {
    const teacher = await requireTeacher();
    const body = CreateQuestionSetSchema.parse(await req.json());

    const targetClass = await prisma.class.findFirst({
      where: {
        id: body.classId,
        teacherId: teacher.id
      }
    });

    if (!targetClass) {
      return NextResponse.json(
        { error: "Class not found or not owned by teacher." },
        { status: 404 }
      );
    }

    const questionSet = await prisma.questionSet.create({
      data: {
        classId: body.classId,
        title: body.title,
        description: body.description || null
      }
    });

    return NextResponse.json({
      success: true,
      questionSet
    });
  } catch (error) {
    console.error("CREATE_QUESTION_SET_ERROR:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid question set input." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Unable to create question set."
      },
      { status: 400 }
    );
  }
}