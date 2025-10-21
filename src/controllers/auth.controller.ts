import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { authService } from "../services/auth.service";
import { mflAuthService } from "../services/mfl-auth.service";
import { AppError } from "../middlewares/error.middleware";

export class AuthController {
  /**
   * Login with MFL credentials
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      const session = await authService.login(username, password);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          cookie: session.cookie,
          username: session.username,
          leagues: session.leagues,
          expiresAt: session.expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current session info
   */
  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const cookie = req.headers["x-mfl-cookie"] as string;

      if (!cookie) {
        throw new AppError(401, "No session cookie provided");
      }

      const session = authService.getSession(cookie);

      if (!session) {
        throw new AppError(401, "Session expired or invalid");
      }

      res.status(200).json({
        success: true,
        data: {
          username: session.username,
          leagues: session.leagues,
          expiresAt: session.expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh user's leagues
   */
  async refreshLeagues(req: Request, res: Response, next: NextFunction) {
    try {
      const cookie = req.headers["x-mfl-cookie"] as string;

      if (!cookie) {
        throw new AppError(401, "No session cookie provided");
      }

      const leagues = await authService.refreshLeagues(cookie);

      res.status(200).json({
        success: true,
        data: { leagues },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const cookie = req.headers["x-mfl-cookie"] as string;

      if (cookie) {
        authService.logout(cookie);
      }

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set lineup for a league
   */
  async setLineup(req: Request, res: Response, next: NextFunction) {
    try {
      const cookie = req.headers["x-mfl-cookie"] as string;
      const { leagueId } = req.params;
      const { players } = req.body;

      if (!cookie) {
        throw new AppError(401, "No session cookie provided");
      }

      const session = authService.getSession(cookie);
      if (!session) {
        throw new AppError(401, "Session expired");
      }

      // Find the franchise ID for this league
      const league = session.leagues.find((l) => l.league_id === leagueId);
      if (!league) {
        throw new AppError(404, "League not found in your account");
      }

      // Use MFL auth service to set lineup
      const result = await mflAuthService.setLineup(
        leagueId,
        league.franchise_id,
        players,
        cookie
      );

      res.status(200).json({
        success: true,
        message: "Lineup updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit waiver claim
   */
  async submitWaiver(req: Request, res: Response, next: NextFunction) {
    try {
      const cookie = req.headers["x-mfl-cookie"] as string;
      const { leagueId } = req.params;
      const { addPlayerId, dropPlayerId } = req.body;

      if (!cookie) {
        throw new AppError(401, "No session cookie provided");
      }

      const session = authService.getSession(cookie);
      if (!session) {
        throw new AppError(401, "Session expired");
      }

      const league = session.leagues.find((l) => l.league_id === leagueId);
      if (!league) {
        throw new AppError(404, "League not found");
      }

      const result = await mflAuthService.submitWaiver(
        leagueId,
        league.franchise_id,
        addPlayerId,
        dropPlayerId,
        cookie
      );

      res.status(200).json({
        success: true,
        message: "Waiver claim submitted",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Propose trade
   */
  async proposeTrade(req: Request, res: Response, next: NextFunction) {
    try {
      const cookie = req.headers["x-mfl-cookie"] as string;
      const { leagueId } = req.params;
      const { offeringPlayers, receivingFranchiseId, requestedPlayers } =
        req.body;

      if (!cookie) {
        throw new AppError(401, "No session cookie provided");
      }

      const session = authService.getSession(cookie);
      if (!session) {
        throw new AppError(401, "Session expired");
      }

      const league = session.leagues.find((l) => l.league_id === leagueId);
      if (!league) {
        throw new AppError(404, "League not found");
      }

      const result = await mflAuthService.proposeTrade(
        leagueId,
        league.franchise_id,
        offeringPlayers,
        receivingFranchiseId,
        requestedPlayers,
        cookie
      );

      res.status(200).json({
        success: true,
        message: "Trade proposed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
