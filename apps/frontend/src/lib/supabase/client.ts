/**
 * Supabase Client - For User-Connected External Tools ONLY
 * 
 * This Supabase client is NOT used for bapx.in authentication.
 * It's only available for users to connect their OWN Supabase projects
 * as external data sources/tools within the bapx.in platform.
 * 
 * For bapx.in authentication, use: @/lib/trailbase/client
 */

import { createBrowserClient } from '@supabase/ssr';

let toolClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Create Supabase client for user's external projects
 * NOT for bapx.in authentication
 */
export function createClient() {
  // Check if user has configured their own Supabase project
  const supabaseUrl = process.env.NEXT_PUBLIC_USER_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_USER_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    // Return a mock client that provides Trailbase auth
    return createTrailbaseAuthClient();
  }

  if (toolClient) {
    return toolClient;
  }

  toolClient = createBrowserClient(supabaseUrl, supabaseKey);
  return toolClient;
}

/**
 * Create Trailbase auth client (PRIMARY for bapx.in)
 * Provides Supabase-compatible interface using Trailbase
 */
function createTrailbaseAuthClient() {
  const trailbaseUrl = process.env.NEXT_PUBLIC_TRAILBASE_URL || 'http://localhost:4000';
  
  // Session storage key
  const SESSION_KEY = 'trailbase_session';
  
  // Helper to get session from cookie/storage
  const getSession = async () => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to get session:', e);
    }
    return null;
  };
  
  // Helper to set session
  const setSession = (session: any) => {
    try {
      if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {
      console.error('Failed to set session:', e);
    }
  };
  
  // Auth state change listeners
  const listeners: Array<(event: string, session: any) => void> = [];
  
  const notifyListeners = (event: string, session: any) => {
    listeners.forEach(fn => fn(event, session));
  };
  
  return {
    auth: {
      getSession: async () => {
        const session = await getSession();
        return { data: { session }, error: null };
      },
      
      getUser: async () => {
        const session = await getSession();
        return { 
          data: { user: session?.user || null }, 
          error: null 
        };
      },
      
      signInWithOtp: async ({ email, options }: any) => {
        try {
          const response = await fetch(`${trailbaseUrl}/api/auth/v1/otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          
          if (response.ok) {
            return { data: { user: null, session: null }, error: null };
          }
          return { data: null, error: { message: 'Failed to send OTP' } };
        } catch (e) {
          return { data: null, error: { message: 'Network error' } };
        }
      },
      
      signInWithPassword: async ({ email, password }: any) => {
        try {
          const response = await fetch(`${trailbaseUrl}/api/auth/v1/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          
          if (response.ok) {
            const data = await response.json();
            const session = {
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              user: data.user,
            };
            setSession(session);
            notifyListeners('SIGNED_IN', session);
            return { data: { user: data.user, session }, error: null };
          }
          return { data: null, error: { message: 'Login failed' } };
        } catch (e) {
          return { data: null, error: { message: 'Network error' } };
        }
      },
      
      signUp: async ({ email, password, options }: any) => {
        try {
          const response = await fetch(`${trailbaseUrl}/api/auth/v1/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, password_repeat: password }),
          });
          
          if (response.ok) {
            const data = await response.json();
            const session = {
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              user: data.user,
            };
            setSession(session);
            notifyListeners('SIGNED_IN', session);
            return { data: { user: data.user, session }, error: null };
          }
          return { data: null, error: { message: 'Signup failed' } };
        } catch (e) {
          return { data: null, error: { message: 'Network error' } };
        }
      },
      
      signOut: async () => {
        setSession(null);
        notifyListeners('SIGNED_OUT', null);
        return { error: null };
      },
      
      updateUser: async ({ password, email }: any) => {
        return { data: null, error: { message: 'Not implemented' } };
      },
      
      resetPasswordForEmail: async (email: string, { redirectTo }: any) => {
        return { data: null, error: { message: 'Not implemented' } };
      },
      
      verifyOtp: async ({ email, token, type }: any) => {
        return { data: null, error: { message: 'Not implemented' } };
      },
      
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        listeners.push(callback);
        return {
          subscription: {
            unsubscribe: () => {
              const index = listeners.indexOf(callback);
              if (index > -1) {
                listeners.splice(index, 1);
              }
            },
          },
        };
      },
    },
    
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null }),
      delete: () => ({ data: [], error: null }),
    }),
    
    rpc: () => ({ data: null, error: null }),
  } as any;
}
