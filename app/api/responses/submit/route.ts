import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { submitStudentResponse } from "@/lib/session-controller";

export const runtime = "nodejs";

const SubmitResponseSchema = z.object({
  extensionToken: z.string().min(20),
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  selectedOption: z.enum(["A", "B", "C", "D"])
});

export async function POST(req: Request) {
  try {
    const body = SubmitResponseSchema.parse(await req.json());

    const student = await prisma.user.findUnique({
      where: {
        extensionToken: body.extensionToken
      }
    });

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json(
        {
          error: "Invalid student token."
        },
        { status: 401 }
      );
    }

    const response = await submitStudentResponse({
      prisma,
      studentId: student.id,
      sessionId: body.sessionId,
      questionId: body.questionId,
      selectedOption: body.selectedOption
    });

    return NextResponse.json({
      success: true,
      response
    });
  } catch (error) {
    console.error("SUBMIT_RESPONSE_ERROR:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message ?? "Invalid response input."
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Unable to submit response."
      },
      { status: 400 }
    );
  }
}