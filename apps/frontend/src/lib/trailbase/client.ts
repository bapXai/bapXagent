/**
 * Trailbase Client - Frontend Authentication
 * 
 * Replaces Supabase client with Trailbase authentication
 */

export interface User {
  id: string;
  email: string;
  created_at?: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  user?: User;
}

export interface AuthResponse {
  success: boolean;
  session?: Session;
  user?: User;
  error?: string;
}

class TrailbaseClient {
  private baseUrl: string;
  private session: Session | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Sign up a new user
   */
  async signup(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/signup`, {
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
      this.session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
      };

      return {
        success: true,
        session: this.session,
        user: data.user,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
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
      this.session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
      };

      return {
        success: true,
        session: this.session,
        user: data.user,
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
  async logout(): Promise<void> {
    this.session = null;
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Get current user
   */
  async getUser(): Promise<User | null> {
    if (!this.session?.access_token) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/user`, {
        headers: {
          'Authorization': `Bearer ${this.session.access_token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const user = await response.json();
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Get current session
   */
  getSession(): Session | null {
    return this.session;
  }

  /**
   * Set session (for SSR cookie restoration)
   */
  setSession(session: Session): void {
    this.session = session;
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.session?.access_token || null;
  }

  /**
   * Send OTP to email
   */
  async sendOtp(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      return response.ok;
    } catch (error) {
      console.error('Send OTP error:', error);
      return false;
    }
  }

  /**
   * Verify OTP
   */
  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: error || 'Verification failed',
        };
      }

      const data = await response.json();
      this.session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
      };

      return {
        success: true,
        session: this.session,
        user: data.user,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      return response.ok;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
  }

  /**
   * Update password with token
   */
  async updatePassword(token: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: error || 'Update failed',
        };
      }

      const data = await response.json();
      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}

// Singleton instance
let trailbaseClient: TrailbaseClient | null = null;

export function createTrailbaseClient(baseUrl?: string): TrailbaseClient {
  if (trailbaseClient) {
    return trailbaseClient;
  }

  const url = baseUrl || process.env.NEXT_PUBLIC_TRAILBASE_URL || 'http://localhost:4000';
  trailbaseClient = new TrailbaseClient(url);
  return trailbaseClient;
}

export { TrailbaseClient };
