import axios from "axios";
import { parseStringPromise } from "xml2js";
import { AppError } from "../middlewares/error.middleware";

interface UserLeague {
  league_id: string;
  league_name: string;
  franchise_id: string;
  franchise_name: string;
  url: string;
}

interface Session {
  cookie: string;
  username: string;
  leagues: UserLeague[];
  expiresAt: Date;
}

class AuthService {
  private readonly MFL_LOGIN_URL = "https://api.myfantasyleague.com/2025/login";
  private readonly MFL_MY_LEAGUES_URL =
    "https://api.myfantasyleague.com/2025/export";

  // In-memory session storage (replace with database in production)
  private sessions: Map<string, Session> = new Map();

  /**
   * Login to MFL and fetch user's leagues
   */
  /**
   * Login to MFL and fetch user's leagues
   */
  async login(username: string, password: string): Promise<Session> {
    console.log("Login attempt for username:", username);

    try {
      // Step 1: Authenticate with MFL
      console.log("Authenticating with MFL...");
      const cookie = await Promise.race([
        this.authenticateMFL(username, password),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Login timeout")), 8000)
        ),
      ]);

      console.log("Authentication successful, cookie received");

      // Step 2: Fetch user's leagues
      console.log("Fetching leagues...");
      const leagues = await this.fetchUserLeagues(cookie);
      console.log("Leagues fetched:", leagues.length);

      // Step 3: Create session
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8);

      const session: Session = {
        cookie,
        username,
        leagues,
        expiresAt,
      };

      this.sessions.set(cookie, session);
      console.log("Session created successfully");

      return session;
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof AppError) throw error;

      // Handle timeout
      if (error instanceof Error && error.message === "Login timeout") {
        throw new AppError(
          408,
          "Login timeout. MFL may be slow or credentials are incorrect."
        );
      }

      throw new AppError(
        401,
        "Failed to login to MFL. Please check your credentials."
      );
    }
  }

  /**
   * Authenticate with MFL and get cookie
   */
  /**
   * Authenticate with MFL and get cookie
   */
  /**
   * Authenticate with MFL and get cookie
   */
  private async authenticateMFL(
    username: string,
    password: string
  ): Promise<string> {
    try {
      const response = await axios.post(
        this.MFL_LOGIN_URL,
        `USERNAME=${encodeURIComponent(username)}&PASSWORD=${encodeURIComponent(password)}&XML=1`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 10000, // 10 second timeout
          maxRedirects: 0,
          validateStatus: (status) => status < 500, // Accept all non-500 responses
        }
      );

      // Check for error response from MFL
      if (response.status === 401 || response.status === 403) {
        throw new AppError(401, "Invalid MFL credentials");
      }

      // Try to parse XML response
      try {
        const xmlData = await parseStringPromise(response.data);

        // Check for error in XML
        if (xmlData.error) {
          throw new AppError(401, "Invalid MFL credentials");
        }

        if (
          xmlData.status &&
          xmlData.status.$ &&
          xmlData.status.$.MFL_USER_ID
        ) {
          return `MFL_USER_ID=${xmlData.status.$.MFL_USER_ID}`;
        }
      } catch (parseError) {
        // XML parsing failed, try headers
        console.log("XML parsing failed, trying headers...");
      }

      // Extract from Set-Cookie header
      const setCookie = response.headers["set-cookie"];
      if (setCookie && Array.isArray(setCookie)) {
        const mflCookie = setCookie.find((cookie) =>
          cookie.includes("MFL_USER_ID")
        );
        if (mflCookie) {
          const match = mflCookie.match(/MFL_USER_ID=([^;]+)/);
          if (match) {
            return `MFL_USER_ID=${match[1]}`;
          }
        }
      }

      // If we got here, login failed
      throw new AppError(401, "Invalid MFL credentials");
    } catch (error) {
      if (error instanceof AppError) throw error;

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          throw new AppError(408, "MFL login timeout. Please try again.");
        }
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new AppError(401, "Invalid MFL credentials");
        }
      }

      console.error("MFL authentication error:", error);
      throw new AppError(
        401,
        "MFL authentication failed. Please check your credentials."
      );
    }
  }

  /**
   * Fetch user's leagues from MFL
   */
  private async fetchUserLeagues(cookie: string): Promise<UserLeague[]> {
    try {
      const response = await axios.get(this.MFL_MY_LEAGUES_URL, {
        params: {
          TYPE: "myleagues",
          JSON: 1,
        },
        headers: {
          Cookie: cookie,
        },
      });

      const data = response.data;

      // Parse MFL response
      if (data.leagues && data.leagues.league) {
        const leagues = Array.isArray(data.leagues.league)
          ? data.leagues.league
          : [data.leagues.league];

        return leagues.map((league: any) => ({
          league_id: league.league_id,
          league_name: league.name,
          franchise_id: league.franchise_id,
          franchise_name:
            league.franchise_name || `Team ${league.franchise_id}`,
          url: league.url,
        }));
      }

      return [];
    } catch (error) {
      console.error("Fetch leagues error:", error);
      // Don't fail login if we can't fetch leagues
      return [];
    }
  }

  /**
   * Get session by cookie
   */
  getSession(cookie: string): Session | null {
    const session = this.sessions.get(cookie);

    if (!session) return null;

    // Check if expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(cookie);
      return null;
    }

    return session;
  }

  /**
   * Verify session is valid
   */
  verifySession(cookie: string): boolean {
    return this.getSession(cookie) !== null;
  }

  /**
   * Logout - remove session
   */
  logout(cookie: string): void {
    this.sessions.delete(cookie);
  }

  /**
   * Refresh user's leagues
   */
  async refreshLeagues(cookie: string): Promise<UserLeague[]> {
    const session = this.getSession(cookie);
    if (!session) {
      throw new AppError(401, "Session expired");
    }

    const leagues = await this.fetchUserLeagues(cookie);
    session.leagues = leagues;

    return leagues;
  }

  /**
   * Get all sessions (for cleanup/monitoring)
   */
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [cookie, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(cookie);
      }
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Cleanup expired sessions every hour
setInterval(
  () => {
    authService.cleanupExpiredSessions();
    console.log("Cleaned up expired sessions");
  },
  60 * 60 * 1000
);

export default authService;
