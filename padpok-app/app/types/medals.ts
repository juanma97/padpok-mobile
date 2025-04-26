export type Medal = {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: string;
};

export const MEDALS: Medal[] = [
  {
    id: 'first_match',
    name: 'Primer Partido',
    description: 'Juega tu primer partido en PadPok',
    icon: 'trophy',
    progress: '0/1 partidos jugados'
  },
  {
    id: 'win_streak_3',
    name: 'Racha de Victorias',
    description: 'Gana 3 partidos seguidos',
    icon: 'flame',
    progress: '0/3 victorias consecutivas'
  },
  {
    id: 'social_butterfly',
    name: 'Mariposa Social',
    description: 'Juega con 5 jugadores diferentes',
    icon: 'people',
    progress: '0/5 jugadores diferentes'
  },
  {
    id: 'early_bird',
    name: 'Madrugador',
    description: 'Juega un partido antes de las 9 AM',
    icon: 'sunny',
    progress: '0/1 partidos matutinos'
  },
  {
    id: 'night_owl',
    name: 'Noctámbulo',
    description: 'Juega un partido después de las 10 PM',
    icon: 'moon',
    progress: '0/1 partidos nocturnos'
  },
  {
    id: 'weekend_warrior',
    name: 'Guerrero de Fin de Semana',
    description: 'Juega 5 partidos en fin de semana',
    icon: 'calendar',
    progress: '0/5 partidos en fin de semana'
  }
]; 