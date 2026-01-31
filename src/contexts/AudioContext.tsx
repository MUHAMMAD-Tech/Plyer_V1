import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Song } from '@/types';

interface AudioContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playlist: Song[];
  currentIndex: number;
  playSong: (song: Song, playlist?: Song[]) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const STORAGE_KEY = 'music-player-state';

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    // Load saved state from localStorage
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const { songId, time, volume: savedVolume } = JSON.parse(savedState);
        if (savedVolume !== undefined) {
          setVolumeState(savedVolume);
          audioRef.current.volume = savedVolume;
        }
        // We'll restore the song when playlist is loaded
        if (songId) {
          sessionStorage.setItem('restore-song-id', songId);
          sessionStorage.setItem('restore-time', time?.toString() || '0');
        }
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }

    // Event listeners
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      // Auto-play next song
      playNext();
    };

    const handleCanPlay = () => {
      if (isPlaying) {
        audio.play().catch(console.error);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
    };
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (currentSong) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          songId: currentSong.id,
          time: currentTime,
          volume,
        })
      );
    }
  }, [currentSong, currentTime, volume]);

  const playSong = (song: Song, newPlaylist?: Song[]) => {
    if (!audioRef.current) return;

    if (newPlaylist) {
      setPlaylist(newPlaylist);
      const index = newPlaylist.findIndex((s) => s.id === song.id);
      setCurrentIndex(index >= 0 ? index : 0);
    }

    setCurrentSong(song);
    // Use local audio URL if available, otherwise use regular URL
    const audioUrl = song.localAudioUrl || song.audio_url;
    if (audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      setIsPlaying(true);
      audioRef.current.play().catch(console.error);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentSong) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const playNext = () => {
    if (playlist.length === 0) return;

    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);
    playSong(playlist[nextIndex]);
  };

  const playPrevious = () => {
    if (playlist.length === 0) return;

    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    playSong(playlist[prevIndex]);
  };

  const seekTo = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const setVolume = (newVolume: number) => {
    if (!audioRef.current) return;
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    audioRef.current.volume = clampedVolume;
    setVolumeState(clampedVolume);
  };

  return (
    <AudioContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        playlist,
        currentIndex,
        playSong,
        togglePlayPause,
        playNext,
        playPrevious,
        seekTo,
        setVolume,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
