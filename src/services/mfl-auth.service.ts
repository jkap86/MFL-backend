import axios, { AxiosError } from "axios";
import { parseStringPromise } from "xml2js";
import { AppError } from "../middlewares/error.middleware";

class MFLAuthService {
  /**
   * Set lineup/roster for a franchise
   */
  async setLineup(
    leagueId: string,
    franchiseId: string,
    players: string[],
    cookie: string
  ): Promise<any> {
    try {
      const response = await axios.post(
        "https://api.myfantasyleague.com/2025/export",
        `TYPE=roster&L=${leagueId}&FRANCHISE_ID=${franchiseId}&PLAYERS=${players.join(",")}&XML=1`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie: cookie,
          },
        }
      );

      const xmlData = await parseStringPromise(response.data);

      if (xmlData.error) {
        throw new AppError(400, xmlData.error._ || "Failed to set lineup");
      }

      return xmlData;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Set lineup error:", error);
      throw new AppError(500, "Failed to update lineup");
    }
  }

  /**
   * Submit a waiver claim
   */
  async submitWaiver(
    leagueId: string,
    franchiseId: string,
    addPlayerId: string,
    dropPlayerId: string,
    cookie: string
  ): Promise<any> {
    try {
      const response = await axios.post(
        "https://api.myfantasyleague.com/2025/export",
        `TYPE=waiver&L=${leagueId}&FRANCHISE_ID=${franchiseId}&ADD=${addPlayerId}&DROP=${dropPlayerId}&XML=1`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie: cookie,
          },
        }
      );

      const xmlData = await parseStringPromise(response.data);

      if (xmlData.error) {
        throw new AppError(400, xmlData.error._ || "Failed to submit waiver");
      }

      return xmlData;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Submit waiver error:", error);
      throw new AppError(500, "Failed to submit waiver claim");
    }
  }

  /**
   * Propose a trade
   */
  async proposeTrade(
    leagueId: string,
    franchiseId: string,
    offeringPlayers: string[],
    receivingFranchiseId: string,
    requestedPlayers: string[],
    cookie: string
  ): Promise<any> {
    try {
      const response = await axios.post(
        "https://api.myfantasyleague.com/2025/export",
        `TYPE=tradeBait&L=${leagueId}&FRANCHISE_ID=${franchiseId}&OFFERED_PLAYERS=${offeringPlayers.join(",")}&FRANCHISE_ID2=${receivingFranchiseId}&REQUESTED_PLAYERS=${requestedPlayers.join(",")}&XML=1`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie: cookie,
          },
        }
      );

      const xmlData = await parseStringPromise(response.data);

      if (xmlData.error) {
        throw new AppError(400, xmlData.error._ || "Failed to propose trade");
      }

      return xmlData;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Propose trade error:", error);
      throw new AppError(500, "Failed to propose trade");
    }
  }
}

// Export singleton instance
export const mflAuthService = new MFLAuthService();
export default mflAuthService;
