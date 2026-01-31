export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
  audio_url: string;
  album_art_url: string;
  created_at?: string;
}

export interface PlaybackState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}
