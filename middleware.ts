import { NextRequest, NextResponse } from 'next/server'

// Paths that should NOT be password-gated (public-facing)
const PUBLIC_PATHS = ['/indemnitor/', '/i/', '/c/', '/api/', '/pay/', '/checkin', '/onboard', '/gate', '/_next/', '/icon.svg', '/favicon.ico', '/sitemap.xml', '/og-image']

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const path = request.nextUrl.pathname

  // bailbooks.vercel.app → BailBooks accounting
  if (hostname.includes('bailbooks') && path === '/') {
    return NextResponse.redirect(new URL('/books', request.url))
  }

  // bailmadesimple.vercel.app → Case Management
  if (hostname.includes('bailmadesimple') && !hostname.includes('bailmadesimple.com') && path === '/') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Password gate for case management (bailmadesimple.vercel.app)
  if (hostname.includes('bailmadesimple') && !hostname.includes('bailmadesimple.com')) {
    const isPublic = PUBLIC_PATHS.some(p => path.startsWith(p))
    if (!isPublic) {
      const authed = request.cookies.get('site_auth')?.value
      if (authed !== 'ok') {
        return NextResponse.redirect(new URL('/gate', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/((?!_next/static|_next/image).*)'],
}
