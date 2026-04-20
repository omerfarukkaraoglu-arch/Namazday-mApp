import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api/public') ||
    pathname.startsWith('/icons') ||
    pathname === '/favicon.ico' || 
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;
  const isLoginPage = pathname === '/login';

  // Yönlendirme mantığı
  if (pathname === '/') {
    return NextResponse.redirect(new URL(token ? '/dashboard' : '/login', request.url));
  }

  // Token kontrolü
  if (!token) {
    if (isLoginPage) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );
    
    // Login sayfasına girmeye çalışırsa ve zaten giriş yapmışsa
    if (isLoginPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Yetki kontrolü (süper adminler ve kurum yöneticileri /yonetim sekmesine girebilir)
    const role = (verified.payload.role as string)?.toUpperCase();
    const username = verified.payload.username as string;
    
    const isSystemAdmin = role === 'SYSTEM_ADMIN' || username === 'admin' || username === 'admin ';
    const isInstitutionAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
    const isAuthorized = isSystemAdmin || isInstitutionAdmin;
    
    // Genel Kurum Yönetimi SADECE Sistem Adminine özeldir
    if (pathname.startsWith('/yonetim/kurumlar') && !isSystemAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Diğer tüm yönetim sayfalarına kurum adminleri girebilir
    if (pathname.startsWith('/yonetim') && !isAuthorized) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Geçersiz token durumu
    request.cookies.delete('auth_token');
    if (!isLoginPage) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
