export type RootStackParamList = {
  Home: undefined;
  Auth: undefined;
  MatchDetails: { matchId: string };
  MatchChat: { matchId: string };
  MatchHistory: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MatchHistory = {
  id: string;
  matchId: string;
  date: string;
  result: 'victory' | 'defeat';
  position: 'top' | 'jungle' | 'mid' | 'adc' | 'support';
  team: string;
  score: {
    teamA: number;
    teamB: number;
  };
}; 