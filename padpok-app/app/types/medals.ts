export type Medal = {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: string;
  type: 'single' | 'progressive';
  requirements: {
    type: 'matches_played' | 'wins' | 'win_streak' | 'unique_players' | 'time_of_day' | 'weekend_matches';
    value: number;
    timeOfDay?: 'morning' | 'night';
  };
};

export type UserMedal = {
  id: string;
  unlocked: boolean;
  progress: number;
  lastUpdated: Date;
  // Datos específicos para medallas progresivas
  winStreak?: number;
  uniquePlayers?: string[];
  weekendMatches?: number;
};

export const MEDALS: Medal[] = [
  {
    id: 'first_match',
    name: 'Primer Partido',
    description: 'Juega tu primer partido en PadPok',
    icon: 'trophy',
    progress: '0/1 partidos jugados',
    type: 'single',
    requirements: {
      type: 'matches_played',
      value: 1
    }
  },
  {
    id: 'win_streak_3',
    name: 'Racha de Victorias',
    description: 'Gana 3 partidos seguidos',
    icon: 'flame',
    progress: '0/3 victorias consecutivas',
    type: 'progressive',
    requirements: {
      type: 'win_streak',
      value: 3
    }
  },
  {
    id: 'social_butterfly',
    name: 'Mariposa Social',
    description: 'Juega con 5 jugadores diferentes',
    icon: 'people',
    progress: '0/5 jugadores diferentes',
    type: 'progressive',
    requirements: {
      type: 'unique_players',
      value: 5
    }
  },
  {
    id: 'early_bird',
    name: 'Madrugador',
    description: 'Juega un partido antes de las 9 AM',
    icon: 'sunny',
    progress: '0/1 partidos matutinos',
    type: 'single',
    requirements: {
      type: 'time_of_day',
      value: 1,
      timeOfDay: 'morning'
    }
  },
  {
    id: 'night_owl',
    name: 'Noctámbulo',
    description: 'Juega un partido después de las 10 PM',
    icon: 'moon',
    progress: '0/1 partidos nocturnos',
    type: 'single',
    requirements: {
      type: 'time_of_day',
      value: 1,
      timeOfDay: 'night'
    }
  },
  {
    id: 'weekend_warrior',
    name: 'Guerrero de Fin de Semana',
    description: 'Juega 5 partidos en fin de semana',
    icon: 'calendar',
    progress: '0/5 partidos en fin de semana',
    type: 'progressive',
    requirements: {
      type: 'weekend_matches',
      value: 5
    }
  }
]; 