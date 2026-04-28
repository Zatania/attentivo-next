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
        class: true,
        scores: {
          include: {
            student: {
              select: {
                fullName: true,
                email: true
              }
            }
          },
          orderBy: {
            attentionScore: "desc"
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404 }
      );
    }

    const csvHeader = [
      "Class",
      "Session ID",
      "Student Name",
      "Email",
      "Answered",
      "Unanswered",
      "Total Questions",
      "Correct",
      "Average Response Time MS",
      "Attention Score",
      "Evaluation Grade",
      "Level"
    ];

    const rows = session.scores.map((score) => [
      session.class.name,
      session.id,
      score.student.fullName,
      score.student.email,
      score.answeredCount,
      score.unansweredCount,
      score.totalQuestions,
      score.correctCount,
      score.averageResponseTimeMs ?? "",
      score.attentionScore,
      score.evaluationGrade,
      score.level
    ]);

    const csv = [csvHeader, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="attentivo-session-${session.id}.csv"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to export report."
      },
      { status: 400 }
    );
  }
}