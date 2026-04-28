import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signAuthToken } from "@/lib/jwt";

export const runtime = "nodejs";

const RegisterSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required."),
  email: z.string().trim().email("Valid email is required.").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["TEACHER", "STUDENT"])
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = RegisterSchema.parse(json);

    const existing = await prisma.user.findUnique({
      where: {
        email: body.email
      }
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "Email is already registered."
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        passwordHash,
        role: body.role,
        extensionToken:
          body.role === "STUDENT"
            ? randomBytes(32).toString("hex")
            : null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        extensionToken: true
      }
    });

    const token = await signAuthToken({
      userId: user.id,
      role: user.role
    });

    const response = NextResponse.json({
      success: true,
      user
    });

    response.cookies.set("attentivo_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error) {
    console.error("REGISTER_ERROR:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message ?? "Invalid registration input."
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown registration error."
            : "Unable to create account."
      },
      { status: 500 }
    );
  }
}