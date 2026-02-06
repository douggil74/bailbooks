import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  // Redirect bailbooks.vercel.app root to /books
  if (hostname.includes('bailbooks') && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/books', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/',
}
