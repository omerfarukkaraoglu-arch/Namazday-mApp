'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';
import { createToken } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Kullanıcı adı ve şifre zorunludur.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { institution: true }
    });

    if (!user || !user.isActive) {
      return { error: 'Kullanıcı bulunamadı veya hesabınız pasif durumda.' };
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return { error: 'Hatalı şifre.' };
    }

    const rememberMe = formData.get('remember') === 'on';
    const expiresIn = rememberMe ? '30d' : '16h';
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 16 * 60 * 60;

    // Create token
    const token = await createToken({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      institutionId: user.institutionId,
      institutionName: user.institution?.name
    }, expiresIn);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge,
    });

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Giriş yapılırken bir hata oluştu.' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  redirect('/login');
}
