import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signAuthToken } from "@/lib/jwt";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const body = LoginSchema.parse(await req.json());

    const user = await prisma.user.findUnique({
      where: { email: body.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const validPassword = await bcrypt.compare(body.password, user.passwordHash);

    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await signAuthToken({
      userId: user.id,
      role: user.role
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        extensionToken: user.extensionToken
      }
    });

    res.cookies.set("attentivo_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: "Invalid login request." },
      { status: 400 }
    );
  }
}