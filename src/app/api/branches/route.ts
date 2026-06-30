export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { BranchService } from '../../../backend/services/branch.service';
import { getAuthenticatedUser, handleUnauthorized, handleError } from '../../../backend/utils/authHelper';

const branchService = new BranchService();

export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return handleUnauthorized();
    const branches = await branchService.getBranches();
    return NextResponse.json({ branches }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

