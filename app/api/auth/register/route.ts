import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signAuthToken } from "@/lib/jwt";

const RegisterSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["TEACHER", "STUDENT"])
});

export async function POST(req: Request) {
  try {
    const body = RegisterSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({
      where: { email: body.email }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email is already registered." },
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
            ? crypto.randomBytes(32).toString("hex")
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

    const res = NextResponse.json({ user });

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
      { error: "Invalid registration request." },
      { status: 400 }
    );
  }
}