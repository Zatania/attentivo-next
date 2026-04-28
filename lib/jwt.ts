import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "replace-this-secret-in-production"
);

export type AuthTokenPayload = {
  userId: string;
  role: "TEACHER" | "STUDENT";
};

export async function signAuthToken(payload: AuthTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);

    if (
      typeof payload.userId !== "string" ||
      (payload.role !== "TEACHER" && payload.role !== "STUDENT")
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      role: payload.role
    };
  } catch {
    return null;
  }
}