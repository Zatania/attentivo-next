import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function formatDateForFilename(value: Date) {
  return value.toISOString().slice(0, 10);
}

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
        questionSet: true,
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
      "Question Set",
      "Session ID",
      "Session Date",
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
      session.questionSet?.title ?? "Not specified",
      session.id,
      session.startedAt.toISOString(),
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

    const classSlug = slugify(session.class.name) || "class";
    const setSlug = slugify(session.questionSet?.title ?? "question-set");
    const datePart = formatDateForFilename(session.startedAt);
    const shortSessionId = session.id.slice(0, 8);

    const filename = `attentivo-${classSlug}-${setSlug}-${datePart}-session-${shortSessionId}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
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