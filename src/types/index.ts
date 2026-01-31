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
  audio_url?: string;
  album_art_url?: string;
  created_at?: string;
  is_local?: boolean;
  file_name?: string;
  // Local file data (not stored in DB)
  file?: File;
  localAudioUrl?: string;
  localAlbumArtUrl?: string;
}

export interface PlaybackState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}
