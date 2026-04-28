import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("attentivo_session")?.value;

  if (!token) return null;

  const payload = await verifyAuthToken(token);

  if (!payload) return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      extensionToken: true
    }
  });
}

export async function requireTeacher() {
  const user = await getCurrentUser();

  if (!user || user.role !== "TEACHER") {
    throw new Error("Unauthorized teacher access.");
  }

  return user;
}

export async function requireStudent() {
  const user = await getCurrentUser();

  if (!user || user.role !== "STUDENT") {
    throw new Error("Unauthorized student access.");
  }

  return user;
}