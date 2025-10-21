// MFL API Response Types

export interface MFLLeague {
  id: string;
  name: string;
  baseURL: string;
  season: string;
  startWeek: string;
  endWeek: string;
  lastRegularSeasonWeek: string;
  nflPoolStartWeek: string;
  nflPoolEndWeek: string;
  rosterSize: string;
  taxiSquad: string;
  injured_reserve: string;
  history?: string[];
  franchises: {
    count: string;
    franchise: MFLFranchise[];
  };
  starters?: {
    count: string;
    position: Array<{ name: string; limit: string }>;
  };
  scoringRules?: {
    rule: MFLScoringRule[];
  };
}

export interface MFLFranchise {
  id: string;
  name: string;
  icon?: string;
  logo?: string;
  bbidAvailableBalance?: string;
  waiverSortOrder?: string;
  owner_name?: string;
}

export interface MFLRoster {
  franchise: {
    id: string;
    player: MFLPlayer[];
  }[];
}

export interface MFLPlayer {
  id: string;
  status: string;
  salary?: string;
  contractYear?: string;
  contractInfo?: string;
}

export interface MFLPlayerDetails {
  id: string;
  name: string;
  position: string;
  team: string;
  draft_year?: string;
  draft_round?: string;
  draft_pick?: string;
  birthdate?: string;
  jersey?: string;
  college?: string;
  status?: string;
}

export interface MFLPlayerScores {
  week: string;
  playerScores: {
    playerScore: Array<{
      id: string;
      score: string;
      isAvailable?: string;
    }>;
  };
}

export interface MFLStandings {
  franchise: Array<{
    id: string;
    h2hw?: string;
    h2hl?: string;
    h2ht?: string;
    divisionWins?: string;
    divisionLosses?: string;
    divisionTies?: string;
    pf?: string;
    pa?: string;
    pp?: string;
    maxpp?: string;
    op?: string;
    coach_record?: string;
    allplay_wins?: string;
    allplay_losses?: string;
    allplay_ties?: string;
    victory_points?: string;
  }>;
}

export interface MFLTransactions {
  transaction: Array<{
    type: string;
    timestamp: string;
    franchise?: string;
    franchise1?: string;
    franchise2?: string;
    activationWeek?: string;
    $?: string;
  }>;
}

export interface MFLScoringRule {
  positions: string;
  event: string;
  value: string;
  range?: string;
}

export interface MFLSchedule {
  weeklySchedule: Array<{
    week: string;
    matchup: Array<{
      franchise: Array<{
        id: string;
        isHome?: string;
        spread?: string;
        result?: string;
      }>;
    }>;
  }>;
}

// API Response Wrapper
export interface MFLResponse<T> {
  version: string;
  encoding: string;
  [key: string]: T | string;
}

// Request Parameters
export interface LeagueParams {
  leagueId: string;
}

export interface RosterParams extends LeagueParams {
  franchiseId?: string;
}

export interface ScoresParams extends LeagueParams {
  week: string;
}

export interface PlayersParams {
  position?: string;
  status?: string;
}

export interface TransactionsParams extends LeagueParams {
  type?: 'WAIVER' | 'TRADE' | 'BBID_WAIVER' | 'IR';
  days?: string;
}