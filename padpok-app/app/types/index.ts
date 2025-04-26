import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type User = {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
};

export type AgeRange = '18-30' | '30-45' | '+45' | 'todas las edades';

export type Match = {
  id: string;
  title: string;
  location: string;
  date: Date;
  playersNeeded: number;
  playersJoined: string[];
  ageRange: AgeRange;
  level: string;
  createdBy: string;
  createdAt: Date;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Matches: undefined;
};

export type HomeTabsParamList = {
  Matches: undefined;
  Create: undefined;
  Ranking: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  Auth: undefined;
  MatchDetails: { match: Match };
} & AuthStackParamList;

export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>;
export type HomeTabScreenProps<T extends keyof HomeTabsParamList> = BottomTabScreenProps<HomeTabsParamList, T>;
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type CreateStackParamList = {
  CreateMatch: undefined;
  SelectLocation: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Matches: undefined;
  CreateMatch: undefined;
  MatchDetails: { match: Match };
  Profile: undefined;
  Ranking: undefined;
  Medals: undefined;
}; 