export type User = {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
};

export type Match = {
  id: string;
  title: string;
  date: Date;
  location: string;
  playersNeeded: number;
  playersJoined: string[]; // array of user IDs
  createdBy: string; // user ID
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  description?: string;
};

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