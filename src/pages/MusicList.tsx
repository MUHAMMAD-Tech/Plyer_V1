import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Music, Moon, Sun } from 'lucide-react';
import { songsApi } from '@/db/api';
import { useAudio } from '@/contexts/AudioContext';
import { SongItem } from '@/components/music/SongItem';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';
import type { Song } from '@/types';

export default function MusicList() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { currentSong, playSong, isPlaying } = useAudio();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    setLoading(true);
    const data = await songsApi.getAllSongs();
    setSongs(data);
    setLoading(false);

    // Restore last played song if available
    const restoreSongId = sessionStorage.getItem('restore-song-id');
    const restoreTime = sessionStorage.getItem('restore-time');
    if (restoreSongId && data.length > 0) {
      const song = data.find((s) => s.id === restoreSongId);
      if (song) {
        playSong(song, data);
        if (restoreTime) {
          setTimeout(() => {
            const audio = document.querySelector('audio');
            if (audio) {
              audio.currentTime = Number.parseFloat(restoreTime);
            }
          }, 100);
        }
      }
      sessionStorage.removeItem('restore-song-id');
      sessionStorage.removeItem('restore-time');
    }
  };

  const handleSongClick = (song: Song) => {
    playSong(song, songs);
    navigate('/player');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Music Player</h1>
              <p className="text-sm text-muted-foreground">
                {songs.length} {songs.length === 1 ? 'song' : 'songs'} available
              </p>
            </div>
          </div>

          <Button variant="outline" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Song List */}
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="w-14 h-14 rounded-md bg-muted" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48 bg-muted" />
                  <Skeleton className="h-4 w-32 bg-muted" />
                </div>
                <Skeleton className="h-4 w-12 bg-muted" />
              </div>
            ))
          ) : songs.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No songs available</p>
            </div>
          ) : (
            songs.map((song) => (
              <SongItem
                key={song.id}
                song={song}
                isPlaying={currentSong?.id === song.id && isPlaying}
                onClick={() => handleSongClick(song)}
              />
            ))
          )}
        </div>

        {/* Now Playing Bar */}
        {currentSong && (
          <div
            onClick={() => navigate('/player')}
            className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 cursor-pointer hover:bg-accent/5 transition-colors"
          >
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              <img
                src={currentSong.album_art_url}
                alt={currentSong.title}
                className="w-12 h-12 rounded-md object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{currentSong.title}</p>
                <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
              </div>
              {isPlaying && (
                <Music className="w-5 h-5 text-primary animate-pulse" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
