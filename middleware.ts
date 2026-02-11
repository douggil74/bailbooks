import { NextRequest, NextResponse } from 'next/server'

// Paths that should NOT be password-gated (public-facing)
const PUBLIC_PATHS = ['/indemnitor/', '/i/', '/c/', '/pay/', '/checkin', '/onboard', '/gate', '/_next/', '/icon.svg', '/favicon.ico', '/sitemap.xml', '/og-image']

// API paths that must remain open (webhooks, public forms, cron)
const PUBLIC_API_PREFIXES = [
  '/api/indemnitor/', '/api/checkin/', '/api/onboard/', '/api/payment/',
  '/api/gate', '/api/sms/webhook', '/api/cron/', '/api/lead',
  '/api/bonds', '/api/quote/', '/api/risk', '/api/recommend',
]

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
    const isPublicPage = PUBLIC_PATHS.some(p => path.startsWith(p))
    const isPublicApi = PUBLIC_API_PREFIXES.some(p => path.startsWith(p))
    if (!isPublicPage && !isPublicApi) {
      const authed = request.cookies.get('site_auth')?.value
      if (authed !== 'ok') {
        // Return 401 for API requests, redirect for pages
        if (path.startsWith('/api/')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/gate', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/((?!_next/static|_next/image).*)'],
}
