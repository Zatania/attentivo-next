import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    questionSetId: string;
  }>;
};

const UpdateQuestionSetSchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().optional(),
  isActive: z.boolean().optional()
});

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const teacher = await requireTeacher();
    const { questionSetId } = await context.params;
    const body = UpdateQuestionSetSchema.parse(await req.json());

    const questionSet = await prisma.questionSet.findFirst({
      where: {
        id: questionSetId,
        class: {
          teacherId: teacher.id
        }
      }
    });

    if (!questionSet) {
      return NextResponse.json(
        { error: "Question set not found." },
        { status: 404 }
      );
    }

    const updatedQuestionSet = await prisma.questionSet.update({
      where: {
        id: questionSetId
      },
      data: {
        title: body.title ?? questionSet.title,
        description:
          typeof body.description === "string"
            ? body.description
            : questionSet.description,
        isActive:
          typeof body.isActive === "boolean"
            ? body.isActive
            : questionSet.isActive
      }
    });

    return NextResponse.json({
      success: true,
      questionSet: updatedQuestionSet
    });
  } catch (error) {
    console.error("UPDATE_QUESTION_SET_ERROR:", error);

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
            : "Unable to update question set."
      },
      { status: 400 }
    );
  }
}