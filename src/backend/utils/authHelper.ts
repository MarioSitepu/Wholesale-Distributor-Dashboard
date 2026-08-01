import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { JwtPayload } from "../types/index";
import { NextResponse } from "next/server";
import { HttpError } from "./errors";

export function getAuthenticatedUser(request: Request): JwtPayload | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    // Bypass auth for local development if frontend hasn't fully integrated JWT login
    if (env.NODE_ENV === "development") {
      return {
        id: "dev-admin",
        role: "superadmin",
        branch: "Pusat",
        username: "superadmin",
      } as JwtPayload;
    }
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (error: any) {
    if (env.NODE_ENV === "development") {
      return {
        id: "dev-admin",
        role: "superadmin",
        branch: "Pusat",
        username: "superadmin",
      } as JwtPayload;
    }
    // Temporarily throw an error with the jwt message for debugging
    throw new HttpError(401, `Token tidak valid: ${error.message} (token: ${token.substring(0, 10)}...)`);
  }
}

export function handleUnauthorized() {
  return NextResponse.json(
    { message: "Token tidak valid atau sudah kedaluwarsa" },
    { status: 401 },
  );
}

export function handleForbidden() {
  return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
}

export function handleError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { message: error.message, ...error.extra },
      { status: error.statusCode },
    );
  }

  console.error("Unhandled Server Error:", error);
  const rawMsg = error instanceof Error ? error.message : String(error);
  let friendlyMessage = "Terjadi kendala pada sistem. Silakan muat ulang halaman atau coba beberapa saat lagi.";

  if (
    rawMsg.includes("EMAXCONNSESSION") ||
    rawMsg.includes("max clients reached") ||
    rawMsg.includes("Can't reach database server") ||
    rawMsg.includes("P1001") ||
    rawMsg.includes("P1002") ||
    rawMsg.includes("connect ETIMEDOUT") ||
    rawMsg.includes("ECONNREFUSED") ||
    rawMsg.includes("Error querying the database")
  ) {
    friendlyMessage = "Koneksi ke basis data sedang padat atau terputus sementara. Silakan muat ulang halaman dalam beberapa detik.";
  } else if (rawMsg.includes("Unique constraint") || rawMsg.includes("P2002")) {
    friendlyMessage = "Data yang Anda masukkan sudah terdaftar di sistem.";
  } else if (rawMsg.includes("Foreign key constraint") || rawMsg.includes("P2003")) {
    friendlyMessage = "Data referensi tidak ditemukan di sistem.";
  } else if (rawMsg.includes("Record to update not found") || rawMsg.includes("P2025")) {
    friendlyMessage = "Data yang ingin diperbarui tidak ditemukan.";
  }

  return NextResponse.json(
    { message: friendlyMessage },
    { status: 500 },
  );
}
