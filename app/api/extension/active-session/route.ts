import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDueQuestionForStudent } from "@/lib/session-controller";

function getBearerToken(req: Request) {
  const header = req.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) return null;

  return header.replace("Bearer ", "").trim();
}

export async function GET(req: Request) {
  const token = getBearerToken(req);

  if (!token) {
    return NextResponse.json(
      {
        active: false,
        error: "Missing extension token."
      },
      { status: 401 }
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
      { status: 401 }
    );
  }

  const result = await getDueQuestionForStudent({
    prisma,
    studentId: student.id
  });

  return NextResponse.json(result);
}