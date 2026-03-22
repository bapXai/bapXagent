/**
 * bapx.in Middleware - Trailbase Authentication
 * 
 * Handles authentication using Trailbase instead of Supabase
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale, type Locale } from '@/i18n/config';
import { detectBestLocaleFromHeaders } from '@/lib/utils/geo-detection-server';

// Marketing pages that support locale routing for SEO
const MARKETING_ROUTES = [
  '/',
  '/bapx',
  '/legal',
  '/support',
  '/templates',
];

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/auth/callback',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/legal',
  '/api/auth',
  '/share',
  '/templates',
  '/master-login',
  '/checkout',
  '/support',
  '/bapx',
  '/help',
  '/credits-explained',
  '/agents-101',
  '/about',
  '/milano',
  '/berlin',
  '/app',
  '/careers',
  '/pricing',
  '/tutorials',
  '/countryerror',
  ...locales.flatMap(locale => MARKETING_ROUTES.map(route => `/${locale}${route === '/' ? '' : route}`)),
];

// Routes that require authentication but are related to billing/trials/setup
const BILLING_ROUTES = [
  '/activate-trial',
  '/subscription',
  '/setting-up',
];

// Routes that require authentication and active subscription
const PROTECTED_ROUTES = [
  '/dashboard',
  '/agents',
  '/projects',
  '/settings',
];

// App store links for mobile redirect
const APP_STORE_LINKS = {
  ios: 'https://apps.apple.com/ie/app/bapx/id6754448524',
  android: 'https://play.google.com/store/apps/details?id=com.bapx.app',
};

// Detect mobile platform from User-Agent header
function detectMobilePlatformFromUA(userAgent: string | null): 'ios' | 'android' | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return null;
}

/**
 * Get session from Trailbase cookies
 */
async function getSession(request: NextRequest) {
  const sessionCookie = request.cookies.get('trailbase_session');
  
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    
    // Verify session is still valid
    const trailbaseUrl = process.env.NEXT_PUBLIC_TRAILBASE_URL || 'http://localhost:4000';
    const response = await fetch(`${trailbaseUrl}/api/auth/v1/status`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🚀 Mobile app store redirect for /milano, /berlin, and /app
  if (pathname === '/milano' || pathname === '/berlin' || pathname === '/app') {
    const userAgent = request.headers.get('user-agent');
    const platform = detectMobilePlatformFromUA(userAgent);

    if (platform) {
      return NextResponse.redirect(APP_STORE_LINKS[platform], { status: 302 });
    }
  }

  // Block access to WIP /thread/new route
  if (pathname.includes('/thread/new')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.woff2')
  ) {
    return NextResponse.next();
  }

  // Get session
  const session = await getSession(request);
  const isLoggedIn = !!session;

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Check if route is billing route
  const isBillingRoute = BILLING_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // Handle authentication redirects
  if (!isLoggedIn) {
    // Redirect to login if trying to access protected or billing routes
    if (isProtectedRoute || isBillingRoute) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle locale routing for marketing pages
  if (isPublicRoute && !pathname.startsWith('/_next')) {
    const locale = detectBestLocaleFromHeaders(request.headers);
    
    if (locale !== defaultLocale && !pathname.startsWith(`/${locale}`)) {
      const localizedPath = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
      return NextResponse.rewrite(new URL(localizedPath, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, sitemap.xml, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
