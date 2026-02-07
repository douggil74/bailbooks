import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const path = request.nextUrl.pathname

  // bailbooks.vercel.app → BailBooks accounting
  if (hostname.includes('bailbooks') && path === '/') {
    return NextResponse.redirect(new URL('/books', request.url))
  }

  // bailmadesimple.vercel.app → Case Management
  if (hostname.includes('bailmadesimple') && path === '/') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/',
}
