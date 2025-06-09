import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { hash, compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Verify current password
    const isValidPassword = await compare(currentPassword, user.password);
    if (!isValidPassword) {
      return new NextResponse('Invalid current password', { status: 400 });
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update password in database
    await prisma.user.update({
      where: { email: session.user.email },
      data: { password: hashedPassword },
    });

    return new NextResponse('Password updated successfully', { status: 200 });
  } catch (error) {
    console.error('Password change error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 