import { NextResponse } from 'next/server';
import { AuthService } from '../../../../backend/services/auth.service';
import { handleError } from '../../../../backend/utils/authHelper';

const authService = new AuthService();

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const result = await authService.login(username, password);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
