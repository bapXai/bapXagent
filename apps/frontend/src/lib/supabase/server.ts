/**
 * Trailbase Server Client
 * 
 * Replaces Supabase server client with Trailbase authentication
 */

'use server'
import { getSession, getUser, login, signup, logout } from '@/lib/trailbase/server';
import { cookies } from 'next/headers';

export { getSession, getUser, login, signup, logout };

// Re-export cookies for compatibility
export { cookies };
