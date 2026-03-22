/**
 * Trailbase Server-Side Auth Helpers
 * 
 * For use in Next.js server components and API routes
 */

import { cookies } from 'next/headers';
import { Session, User } from './client';

const TRAILBASE_URL = process.env.NEXT_PUBLIC_TRAILBASE_URL || 'http://localhost:4000';

/**
 * Get session from cookies
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('trailbase_session');

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value) as Session;
    
    // Verify session is still valid
    const response = await fetch(`${TRAILBASE_URL}/auth/user`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      // Session invalid, clear cookie
      return null;
    }

    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Get current user from session
 */
export async function getUser(): Promise<User | null> {
  const session = await getSession();
  
  if (!session?.access_token) {
    return null;
  }

  try {
    const response = await fetch(`${TRAILBASE_URL}/auth/user`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Set session cookie
 */
export async function setSessionCookie(session: Session): Promise<void> {
  const cookieStore = await cookies();
  
  const expires = session.expires_in 
    ? new Date(Date.now() + session.expires_in * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default

  cookieStore.set('trailbase_session', JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires,
    path: '/',
  });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('trailbase_session');
}

/**
 * Login with email/password
 */
export async function login(email: string, password: string): Promise<{
  success: boolean;
  error?: string;
  session?: Session;
}> {
  try {
    const response = await fetch(`${TRAILBASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: error || 'Login failed',
      };
    }

    const data = await response.json();
    const session: Session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
      expires_in: data.expires_in,
    };

    await setSessionCookie(session);

    return {
      success: true,
      session,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Signup with email/password
 */
export async function signup(email: string, password: string): Promise<{
  success: boolean;
  error?: string;
  session?: Session;
}> {
  try {
    const response = await fetch(`${TRAILBASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: error || 'Signup failed',
      };
    }

    const data = await response.json();
    const session: Session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
      expires_in: data.expires_in,
    };

    await setSessionCookie(session);

    return {
      success: true,
      session,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  await clearSessionCookie();
  
  try {
    await fetch(`${TRAILBASE_URL}/auth/logout`, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser();
  return user !== null;
}

/**
 * Require authentication (throw if not authenticated)
 */
export async function requireAuth(): Promise<User> {
  const user = await getUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}
