import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

const CreateClassSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional()
});

function generateClassCode() {
  return `ATTN-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function POST(req: Request) {
  try {
    const teacher = await requireTeacher();
    const body = CreateClassSchema.parse(await req.json());

    let classCode = generateClassCode();

    while (await prisma.class.findUnique({ where: { classCode } })) {
      classCode = generateClassCode();
    }

    const createdClass = await prisma.class.create({
      data: {
        teacherId: teacher.id,
        name: body.name,
        description: body.description,
        classCode
      }
    });

    return NextResponse.json({
      success: true,
      class: createdClass
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to create class." },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const teacher = await requireTeacher();

    const classes = await prisma.class.findMany({
      where: { teacherId: teacher.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            enrollments: true,
            sessions: true,
            questions: true
          }
        }
      }
    });

    return NextResponse.json({ classes });
  } catch {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }
}