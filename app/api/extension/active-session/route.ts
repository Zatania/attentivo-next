import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDueQuestionForStudent } from "@/lib/session-controller";
import { withCorsHeaders } from "@/lib/cors";

export const runtime = "nodejs";

function getBearerToken(req: Request) {
  const header = req.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) return null;

  return header.replace("Bearer ", "").trim();
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: withCorsHeaders()
  });
}

export async function GET(req: Request) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return NextResponse.json(
        {
          active: false,
          error: "Missing extension token."
        },
        {
          status: 401,
          headers: withCorsHeaders()
        }
      );
    }

    const student = await prisma.user.findUnique({
      where: {
        extensionToken: token
      }
    });

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json(
        {
          active: false,
          error: "Invalid extension token."
        },
        {
          status: 401,
          headers: withCorsHeaders()
        }
      );
    }

    const result = await getDueQuestionForStudent({
      prisma,
      studentId: student.id
    });

    return NextResponse.json(result, {
      status: 200,
      headers: withCorsHeaders()
    });
  } catch (error) {
    console.error("ACTIVE_SESSION_ERROR:", error);

    return NextResponse.json(
      {
        active: false,
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Unable to check active session."
      },
      {
        status: 500,
        headers: withCorsHeaders()
      }
    );
  }
}