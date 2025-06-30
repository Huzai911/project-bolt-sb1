interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  lastLogin: Date;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

class AuthService {
  private readonly STORAGE_KEY = 'auth_state';
  private readonly USERS_KEY = 'registered_users';

  private currentAuthState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null
  };

  constructor() {
    this.loadAuthState();
  }

  private loadAuthState(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.currentAuthState = {
          ...parsed,
          user: parsed.user ? {
            ...parsed.user,
            createdAt: new Date(parsed.user.createdAt),
            lastLogin: new Date(parsed.user.lastLogin)
          } : null
        };
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
      this.clearAuthState();
    }
  }

  private saveAuthState(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentAuthState));
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  }

  private clearAuthState(): void {
    this.currentAuthState = {
      isAuthenticated: false,
      user: null,
      token: null
    };
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private getRegisteredUsers(): User[] {
    try {
      const stored = localStorage.getItem(this.USERS_KEY);
      if (stored) {
        const users = JSON.parse(stored);
        return users.map((user: any) => ({
          ...user,
          createdAt: new Date(user.createdAt),
          lastLogin: new Date(user.lastLogin)
        }));
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
    return [];
  }

  private saveUser(user: User): void {
    try {
      const users = this.getRegisteredUsers();
      const existingIndex = users.findIndex(u => u.id === user.id);
      
      if (existingIndex >= 0) {
        users[existingIndex] = user;
      } else {
        users.push(user);
      }
      
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const users = this.getRegisteredUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        return { success: false, error: 'No account found with this email address' };
      }

      // For demo purposes, any password works for existing users
      // In production, you'd verify the actual password hash
      if (password.length < 3) {
        return { success: false, error: 'Invalid password' };
      }

      // Update last login
      user.lastLogin = new Date();
      this.saveUser(user);

      // Set auth state
      this.currentAuthState = {
        isAuthenticated: true,
        user,
        token: `token_${user.id}_${Date.now()}`
      };

      this.saveAuthState();
      return { success: true };

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  async signup(email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Basic validation
      if (!email || !password || !name) {
        return { success: false, error: 'All fields are required' };
      }

      if (password.length < 3) {
        return { success: false, error: 'Password must be at least 3 characters' };
      }

      if (!email.includes('@')) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      const users = this.getRegisteredUsers();
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (existingUser) {
        return { success: false, error: 'An account with this email already exists' };
      }

      // Create new user
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: email.toLowerCase(),
        name: name.trim(),
        createdAt: new Date(),
        lastLogin: new Date()
      };

      this.saveUser(newUser);

      // Set auth state
      this.currentAuthState = {
        isAuthenticated: true,
        user: newUser,
        token: `token_${newUser.id}_${Date.now()}`
      };

      this.saveAuthState();
      return { success: true };

    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Signup failed. Please try again.' };
    }
  }

  logout(): void {
    this.clearAuthState();
  }

  getCurrentUser(): User | null {
    return this.currentAuthState.user;
  }

  isAuthenticated(): boolean {
    return this.currentAuthState.isAuthenticated;
  }

  getAuthToken(): string | null {
    return this.currentAuthState.token;
  }

  // Demo method to create some sample users
  createDemoUsers(): void {
    const demoUsers: User[] = [
      {
        id: 'demo_user_1',
        email: 'demo@example.com',
        name: 'Demo User',
        createdAt: new Date('2025-01-01'),
        lastLogin: new Date()
      },
      {
        id: 'demo_user_2',
        email: 'nate@company.com',
        name: 'Nate Smith',
        createdAt: new Date('2025-01-01'),
        lastLogin: new Date()
      }
    ];

    demoUsers.forEach(user => this.saveUser(user));
  }
}

export const authService = new AuthService();
export type { User, AuthState };