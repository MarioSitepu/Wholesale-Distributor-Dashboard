export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { z } from "zod";
import { AccountService } from "../../../backend/services/account.service";
import {
  getAuthenticatedUser,
  handleUnauthorized,
  handleForbidden,
  handleError,
} from "../../../backend/utils/authHelper";

const accountService = new AccountService();

const createAccountSchema = z
  .object({
    username: z.string().min(1),
    password: z.string().min(6),
    role: z.enum(["admin", "superadmin"]),
    branch: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === "admin" && !data.branch) return false;
      return true;
    },
    {
      message: "Cabang wajib diisi untuk role Admin",
      path: ["branch"],
    },
  );

export async function GET(request: Request) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();
  if (user.branch !== "Pusat") return handleForbidden();

  try {
    const accounts = await accountService.getAccounts();
    return NextResponse.json(accounts, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const user = getAuthenticatedUser(request);
  if (!user) return handleUnauthorized();
  if (user.branch !== "Pusat") return handleForbidden();

  try {
    const body = createAccountSchema.parse(await request.json());
    const account = await accountService.createAccount({
      ...body,
      branch: body.branch || "Pusat",
    });
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

