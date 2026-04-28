import { SignJWT, jwtVerify } from "jose";

const rawSecret = process.env.AUTH_SECRET;

if (!rawSecret && process.env.NODE_ENV === "production") {
  throw new Error("AUTH_SECRET is required in production.");
}

const secret = new TextEncoder().encode(
  rawSecret ?? "development-only-attentivo-secret-change-me"
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

export async function verifyAuthToken(
  token: string
): Promise<AuthTokenPayload | null> {
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