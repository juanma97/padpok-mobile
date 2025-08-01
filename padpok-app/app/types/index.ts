import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Timestamp } from 'firebase/firestore';

// Tipos base
export type AgeRange = '18-30' | '30-45' | '+45' | 'todas las edades';

export type Score = {
  set1: {
    team1: number;
    team2: number;
  };
  set2: {
    team1: number;
    team2: number;
  };
  set3?: {
    team1: number;
    team2: number;
  };
  winner: 'team1' | 'team2';
};

export type Match = {
  id: string;
  title: string;
  location: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  description: string;
  date: Date;
  ageRange: AgeRange;
  playersNeeded: number;
  playersJoined: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  score?: Score;
  teams?: {
    team1: string[];
    team2: string[];
  };
};

export type User = {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  username: string;
  stats: {
    matchesPlayed: number;
    matchesWon: number;
    matchesLost: number;
    currentStreak: number;
    bestStreak: number;
  };
};

// Tipos de navegación
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type HomeTabsParamList = {
  Matches: undefined;
  CreateMatch: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  Matches: undefined;
  MatchDetails: { matchId: string };
  MatchChat: { matchId: string };
  MatchHistory: undefined;
  Profile: { userId: string };
};

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Profile: { userId: string };
  MatchDetails: { matchId: string };
  MatchChat: { matchId: string };
  MatchHistory: undefined;
} & AuthStackParamList;

// Props de navegación
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>;
export type HomeTabScreenProps<T extends keyof HomeTabsParamList> = BottomTabScreenProps<HomeTabsParamList, T>;
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

// Otros tipos
export type CreateStackParamList = {
  CreateMatch: undefined;
  SelectLocation: undefined;
};

export type NotificationType = 'match_full' | 'result_added' | 'result_confirmed' | 'add_result' | 'match_cancelled';

export type Notification = {
  id: string;
  type: NotificationType;
  matchId: string;
  matchTitle: string;
  userId: string;
  read: boolean;
  createdAt: Timestamp;
  data?: {
    score?: Score;
    confirmedBy?: string[];
  };
}; 