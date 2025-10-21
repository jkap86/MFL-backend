// Authentication Types for MFL

export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt: Date;
  leagues: UserLeague[];
}

export interface UserLeague {
  leagueId: string;
  leagueName: string;
  franchiseId: string;
  franchiseName: string;
  role: "owner" | "co-owner" | "viewer";
  addedAt: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AddLeagueRequest {
  leagueId: string;
  password?: string; // MFL league password if required
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: number;
}

export interface JWTPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

// In-memory user storage (for MVP - replace with database later)
export interface UserStorage {
  [userId: string]: User & { passwordHash: string };
}
