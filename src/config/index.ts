import dotenv from "dotenv";

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || "3000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
  },
  mfl: {
    baseUrl: process.env.MFL_BASE_URL || "https://api.myfantasyleague.com/2025",
    apiYear: process.env.MFL_API_YEAR || "2025",
  },
  cache: {
    ttl: {
      leagueInfo: parseInt(process.env.CACHE_TTL_LEAGUE_INFO || "3600", 10),
      rosters: parseInt(process.env.CACHE_TTL_ROSTERS || "900", 10),
      liveScores: parseInt(process.env.CACHE_TTL_LIVE_SCORES || "120", 10),
      players: parseInt(process.env.CACHE_TTL_PLAYERS || "86400", 10),
      standings: parseInt(process.env.CACHE_TTL_STANDINGS || "1800", 10),
      transactions: parseInt(process.env.CACHE_TTL_TRANSACTIONS || "600", 10),
    },
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || "your-super-secret-jwt-key",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "10", 10),
  },
};

export default config;
