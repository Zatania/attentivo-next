import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signAuthToken } from "@/lib/jwt";
import { authCookieName, getAuthCookieOptions } from "@/lib/cookie-options";

export const runtime = "nodejs";

const LoginSchema = z.object({
  email: z.string().trim().email("Valid email is required.").toLowerCase(),
  password: z.string().min(1, "Password is required.")
});

export async function POST(req: Request) {
  try {
    const body = LoginSchema.parse(await req.json());

    const user = await prisma.user.findUnique({
      where: {
        email: body.email
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(
      body.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await signAuthToken({
      userId: user.id,
      role: user.role
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        extensionToken: user.extensionToken
      }
    });

    response.cookies.set(authCookieName, token, getAuthCookieOptions());

    return response;
  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message ?? "Invalid login input."
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Unable to login."
      },
      { status: 500 }
    );
  }
}