import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type HomeTabsParamList = {
  Matches: undefined;
  Ranking: undefined;
  CreateMatch: undefined;
  Profile: undefined;
  Groups: undefined;
};

export type HomeStackParamList = {
  Matches: { refresh?: boolean };
  MatchDetails: { matchId: string };
  MatchChat: { matchId: string };
  MatchHistory: undefined;
  Profile: { userId: string };
};

export type RootStackParamList = {
  Auth: undefined;
  Home: { screen?: keyof HomeTabsParamList; params?: object } | undefined;
  CreateGroup: undefined;
  GroupDetails: { groupId: string };
  Profile: { userId: string };
  MatchDetails: { matchId: string };
  MatchChat: { matchId: string };
  MatchHistory: undefined;
} & AuthStackParamList;

export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>;
export type HomeTabScreenProps<T extends keyof HomeTabsParamList> = BottomTabScreenProps<HomeTabsParamList, T>;
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type CreateStackParamList = {
  CreateMatch: undefined;
  SelectLocation: undefined;
}; 