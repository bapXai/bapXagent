/**
 * Trailbase Auth Module
 * 
 * Client-side and server-side authentication helpers
 */

// Client-side
export { TrailbaseClient, createTrailbaseClient } from './client';
export type { User, Session, AuthResponse } from './client';

// Server-side
export {
  getSession,
  getUser,
  setSessionCookie,
  clearSessionCookie,
  login,
  signup,
  logout,
  isAuthenticated,
  requireAuth,
} from './server';
