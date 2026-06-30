import { NextResponse } from 'next/server'; 
import { getAuthenticatedUser } from '../../../../backend/utils/authHelper'; 

export const dynamic = 'force-dynamic'; 

export async function GET(request: Request) { 
  const user = getAuthenticatedUser(request); 
  const { searchParams } = new URL(request.url); 
  const branch = searchParams.get('branch'); 
  return NextResponse.json({ user, branch }); 
}
