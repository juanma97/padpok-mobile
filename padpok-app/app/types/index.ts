export type User = {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
};

export type AgeRange = '18-30' | '30-45' | '+45' | 'todas las edades';

export interface Match {
  id?: string;
  title: string;
  location: string;
  date: Date;
  playersNeeded: number;
  playersJoined: string[];
  createdBy: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  description?: string;
  createdAt: any; // FirebaseTimestamp
  clubZone: string;
  telegramGroup?: string;
  ageRange: AgeRange;
}

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type HomeTabsParamList = {
  Matches: undefined;
  Create: undefined;
  Profile: undefined;
};

export type CreateStackParamList = {
  CreateMatch: undefined;
  SelectLocation: undefined;
};

export type HomeStackParamList = {
  Matches: undefined;
  CreateMatch: undefined;
  MatchDetails: { match: Match };
}; 