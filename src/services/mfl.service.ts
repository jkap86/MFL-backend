import axios, { AxiosInstance, AxiosError } from "axios";
import { config } from "../config";
import { cacheService } from "./cache.service";
import {
  MFLLeague,
  MFLRoster,
  MFLPlayerDetails,
  MFLPlayerScores,
  MFLStandings,
  MFLTransactions,
  MFLSchedule,
  MFLResponse,
  LeagueParams,
  RosterParams,
  ScoresParams,
  PlayersParams,
  TransactionsParams,
} from "../types/mfl.types";

class MFLService {
  private client: AxiosInstance;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private readonly MAX_REQUESTS_PER_SECOND = 2;

  constructor() {
    this.client = axios.create({
      baseURL: config.mfl.baseUrl,
      timeout: 10000,
      headers: {
        Accept: "application/json",
        "User-Agent": "MFL-Flutter-App/1.0",
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`MFL API Request: ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error("MFL API Error:", error.message);
        if (error.response) {
          console.error("Status:", error.response.status);
          console.error("Data:", error.response.data);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Rate-limited request wrapper
   */
  private async queueRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Process request queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        await request();
        // Rate limit: wait between requests
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 / this.MAX_REQUESTS_PER_SECOND)
        );
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Generic API call with caching
   */
  private async makeRequest<T>(
    endpoint: string,
    cacheKey: string,
    cacheType:
      | "leagueInfo"
      | "rosters"
      | "liveScores"
      | "players"
      | "standings"
      | "transactions"
  ): Promise<T> {
    // Check cache first
    const cached = cacheService.get<T>(cacheType, cacheKey);
    if (cached) {
      return cached;
    }

    // Make API request with rate limiting
    const response = await this.queueRequest(() =>
      this.client.get<MFLResponse<T>>(endpoint, {
        params: { JSON: 1 },
      })
    );

    // Extract data from MFL response wrapper
    const data = this.extractData<T>(response.data);

    // Cache the result
    cacheService.set(cacheType, cacheKey, data);

    return data;
  }

  /**
   * Extract actual data from MFL response wrapper
   */
  private extractData<T>(response: MFLResponse<T>): T {
    // MFL wraps responses in objects with version/encoding
    // Find the actual data key (not version/encoding)
    const dataKey = Object.keys(response).find(
      (key) => key !== "version" && key !== "encoding"
    );

    if (!dataKey) {
      throw new Error("Invalid MFL response format");
    }

    return response[dataKey] as T;
  }

  /**
   * Get league information
   */
  async getLeague({ leagueId }: LeagueParams): Promise<MFLLeague> {
    return this.makeRequest<MFLLeague>(`/export`, leagueId, "leagueInfo");
  }

  /**
   * Get rosters for a league
   */
  async getRosters({
    leagueId,
    franchiseId,
  }: RosterParams): Promise<MFLRoster> {
    const cacheKey = franchiseId ? `${leagueId}-${franchiseId}` : leagueId;
    const endpoint = `/export?TYPE=rosters&L=${leagueId}${
      franchiseId ? `&FRANCHISE=${franchiseId}` : ""
    }`;

    return this.makeRequest<MFLRoster>(endpoint, cacheKey, "rosters");
  }

  /**
   * Get player scores for a week
   */
  async getPlayerScores({
    leagueId,
    week,
  }: ScoresParams): Promise<MFLPlayerScores> {
    const endpoint = `/export?TYPE=playerScores&L=${leagueId}&W=${week}`;

    return this.makeRequest<MFLPlayerScores>(
      endpoint,
      `${leagueId}-${week}`,
      "liveScores"
    );
  }

  /**
   * Get all players
   */
  async getPlayers({ position, status }: PlayersParams = {}): Promise<{
    players: { player: MFLPlayerDetails[] };
  }> {
    let endpoint = `/export?TYPE=players`;

    if (position) endpoint += `&POSITION=${position}`;
    if (status) endpoint += `&DETAILS=1`;

    const cacheKey = `all-${position || "all"}-${status || "all"}`;

    return this.makeRequest<{ players: { player: MFLPlayerDetails[] } }>(
      endpoint,
      cacheKey,
      "players"
    );
  }

  /**
   * Get league standings
   */
  async getStandings({ leagueId }: LeagueParams): Promise<MFLStandings> {
    const endpoint = `/export?TYPE=leagueStandings&L=${leagueId}`;

    return this.makeRequest<MFLStandings>(endpoint, leagueId, "standings");
  }

  /**
   * Get transactions
   */
  async getTransactions({
    leagueId,
    type,
    days = "7",
  }: TransactionsParams): Promise<MFLTransactions> {
    let endpoint = `/export?TYPE=transactions&L=${leagueId}&DAYS=${days}`;

    if (type) endpoint += `&TRANS_TYPE=${type}`;

    const cacheKey = `${leagueId}-${type || "all"}-${days}`;

    return this.makeRequest<MFLTransactions>(
      endpoint,
      cacheKey,
      "transactions"
    );
  }

  /**
   * Get league schedule
   */
  async getSchedule({ leagueId }: LeagueParams): Promise<MFLSchedule> {
    const endpoint = `/export?TYPE=leagueSchedule&L=${leagueId}`;

    return this.makeRequest<MFLSchedule>(
      endpoint,
      leagueId,
      "leagueInfo" // Use leagueInfo cache type since schedule doesn't change often
    );
  }

  /**
   * Invalidate cache for a specific league
   */
  invalidateLeagueCache(leagueId: string): void {
    cacheService.delete("leagueInfo", leagueId);
    cacheService.delete("rosters", leagueId);
    cacheService.delete("standings", leagueId);
    console.log(`Cache invalidated for league: ${leagueId}`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return cacheService.getStats();
  }
}

// Export singleton instance
export const mflService = new MFLService();
export default mflService;
