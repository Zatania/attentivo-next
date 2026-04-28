import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    questionId: string;
  }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const teacher = await requireTeacher();
    const { questionId } = await context.params;
    const body = await req.json();

    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        class: {
          teacherId: teacher.id
        }
      }
    });

    if (!question) {
      return NextResponse.json(
        {
          error: "Question not found."
        },
        { status: 404 }
      );
    }

    const updatedQuestion = await prisma.question.update({
      where: {
        id: questionId
      },
      data: {
        isActive:
          typeof body.isActive === "boolean"
            ? body.isActive
            : question.isActive
      }
    });

    return NextResponse.json({
      success: true,
      question: updatedQuestion
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Unable to update question."
      },
      { status: 400 }
    );
  }
}