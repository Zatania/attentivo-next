import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const teacher = await requireTeacher();
    const { sessionId } = await context.params;

    const session = await prisma.classSession.findFirst({
      where: {
        id: sessionId,
        teacherId: teacher.id
      },
      include: {
        questionSet: true,
        class: {
          include: {
            enrollments: {
              include: {
                student: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        sessionQuestions: true,
        responses: true
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404 }
      );
    }

    const totalQuestions = session.sessionQuestions.length;

    const students = session.class.enrollments.map((enrollment) => {
      const responses = session.responses.filter(
        (response) => response.studentId === enrollment.studentId
      );

      const answered = responses.filter(
        (response) => response.responseStatus === "ANSWERED"
      );

      return {
        studentId: enrollment.student.id,
        fullName: enrollment.student.fullName,
        email: enrollment.student.email,
        answeredCount: answered.length,
        totalQuestions,
        correctCount: answered.filter((response) => response.isCorrect).length,
        progress:
          totalQuestions > 0
            ? Number(((answered.length / totalQuestions) * 100).toFixed(2))
            : 0
      };
    });

    return NextResponse.json({
      sessionId: session.id,
      classId: session.classId,
      questionSetId: session.questionSetId,
      questionSetTitle: session.questionSet?.title ?? null,
      status: session.status,
      totalQuestions,
      students
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load live session."
      },
      { status: 400 }
    );
  }
}