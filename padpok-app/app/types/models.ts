import { Timestamp } from 'firebase/firestore';

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

export type NotificationType = 'match_full' | 'result_added' | 'result_confirmed';

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