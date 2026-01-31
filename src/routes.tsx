import MusicList from './pages/MusicList';
import MusicPlayer from './pages/MusicPlayer';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Music List',
    path: '/',
    element: <MusicList />
  },
  {
    name: 'Music Player',
    path: '/player',
    element: <MusicPlayer />,
    visible: false
  }
];

export default routes;
