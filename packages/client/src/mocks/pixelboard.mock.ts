import { IPixelBoard } from '@/types';
import { MOCK_CURRENT_USER } from './user.mock';

const USER_ID = MOCK_CURRENT_USER._id;

export const MOCK_PIXELBOARDS: IPixelBoard[] = [
  {
    _id: 'board-001',
    name: 'Pixel Wars 2026',
    width: 64,
    height: 64,
    position_x: 0,
    position_y: 0,
    status: 'IN_PROGRESS',
    allow_override: true,
    delay_seconds: 30,
    contributions: [
      { userId: USER_ID, nb_pixels_placed: 42, is_author: false },
      { userId: 'user-other-01', nb_pixels_placed: 120, is_author: true },
      { userId: 'user-other-02', nb_pixels_placed: 87, is_author: false },
    ],
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-04-06T18:00:00.000Z',
  },
  {
    _id: 'board-002',
    name: 'MBDS Art Collab',
    width: 32,
    height: 32,
    position_x: 0,
    position_y: 0,
    status: 'IN_PROGRESS',
    allow_override: false,
    delay_seconds: 60,
    contributions: [
      { userId: USER_ID, nb_pixels_placed: 15, is_author: false },
      { userId: 'user-other-03', nb_pixels_placed: 200, is_author: true },
    ],
    createdAt: '2026-03-20T12:00:00.000Z',
    updatedAt: '2026-04-05T09:00:00.000Z',
  },
  {
    _id: 'board-003',
    name: 'Retro Game Tribute',
    width: 128,
    height: 128,
    position_x: 0,
    position_y: 0,
    status: 'FINISHED',
    allow_override: true,
    delay_seconds: 10,
    contributions: [
      { userId: USER_ID, nb_pixels_placed: 256, is_author: false },
      { userId: 'user-other-01', nb_pixels_placed: 512, is_author: true },
      { userId: 'user-other-04', nb_pixels_placed: 340, is_author: false },
    ],
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-02-28T23:59:59.000Z',
  },
  {
    _id: 'board-004',
    name: 'Sunset Canvas',
    width: 48,
    height: 48,
    position_x: 0,
    position_y: 0,
    status: 'FINISHED',
    allow_override: false,
    delay_seconds: 120,
    contributions: [
      { userId: USER_ID, nb_pixels_placed: 88, is_author: false },
    ],
    createdAt: '2026-02-10T10:00:00.000Z',
    updatedAt: '2026-03-10T10:00:00.000Z',
  },
];
