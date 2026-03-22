/**
 * Trailbase Browser Client
 * 
 * Replaces Supabase client with Trailbase authentication
 */

import { createTrailbaseClient } from '@/lib/trailbase/client';

// Singleton instance
let client: ReturnType<typeof createTrailbaseClient> | null = null;

export function createClient() {
  if (client) {
    return client;
  }

  const trailbaseUrl = process.env.NEXT_PUBLIC_TRAILBASE_URL || 'http://localhost:4000';
  client = createTrailbaseClient(trailbaseUrl);
  return client;
}
