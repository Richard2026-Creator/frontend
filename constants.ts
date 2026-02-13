
import { RoomType, StyleCategory } from './types';

export const DEFAULT_ROOM_TYPES: RoomType[] = [
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Bathroom',
  'Dining',
  'Home Office',
];

export const DEFAULT_CATEGORIES: StyleCategory[] = [
  { id: '1', name: 'Minimalist' },
  { id: '2', name: 'Scandinavian' },
  { id: '3', name: 'Japandi' },
  { id: '4', name: 'Timeless Classic' },
  { id: '5', name: 'Contemporary Modern' },
  { id: '6', name: 'Vintage' },
  { id: '7', name: 'Industrial' },
  { id: '8', name: 'Bohemian' },
  { id: '9', name: 'Decorative' },
  { id: '10', name: 'Luxury Glamour' },
];

export const MIN_LIBRARY_SIZE = 5;
export const DEFAULT_SESSION_LENGTH = 30;
export const MAX_SESSION_LENGTH = 40;
export const MIN_SESSION_LENGTH = 5;
