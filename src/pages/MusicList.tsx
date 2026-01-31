import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Music, Moon, Sun, Trash2 } from 'lucide-react';
import { songsApi } from '@/db/api';
import { useAudio } from '@/contexts/AudioContext';
import { SongItem } from '@/components/music/SongItem';
import { FileUpload } from '@/components/music/FileUpload';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from 'next-themes';
import type { Song } from '@/types';
import { getLocalSongs, deleteLocalSong, getAudioFile, getImageFile, initIndexedDB } from '@/db/localStorageDb';

export default function MusicList() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { currentSong, playSong, isPlaying } = useAudio();
  const [onlineSongs, setOnlineSongs] = useState<Song[]>([]);
  const [localSongs, setLocalSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('local');

  useEffect(() => {
    loadAllSongs();
  }, []);

  const loadAllSongs = async () => {
    setLoading(true);
    
    // Initialize IndexedDB
    await initIndexedDB();
    
    // Load online songs
    const online = await songsApi.getAllSongs();
    setOnlineSongs(online);
    
    // Load local songs
    const local = getLocalSongs();
    setLocalSongs(local);
    
    setLoading(false);

    // Restore last played song if available
    const restoreSongId = sessionStorage.getItem('restore-song-id');
    const restoreTime = sessionStorage.getItem('restore-time');
    if (restoreSongId) {
      const allSongs = [...local, ...online];
      const song = allSongs.find((s) => s.id === restoreSongId);
      if (song) {
        await handleSongClick(song, allSongs);
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

  const handleSongClick = async (song: Song, playlist?: Song[]) => {
    // If local song, load file from IndexedDB
    if (song.is_local) {
      const audioFile = await getAudioFile(song.id);
      const imageFile = await getImageFile(song.id);
      
      if (audioFile) {
        const audioUrl = URL.createObjectURL(audioFile);
        const imageUrl = imageFile ? URL.createObjectURL(imageFile) : undefined;
        
        const songWithUrls = {
          ...song,
          localAudioUrl: audioUrl,
          localAlbumArtUrl: imageUrl,
        };
        
        playSong(songWithUrls, playlist || [...localSongs, ...onlineSongs]);
      }
    } else {
      playSong(song, playlist || [...localSongs, ...onlineSongs]);
    }
    
    navigate('/player');
  };

  const handleDeleteLocal = async (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm('Bu qo\'shiqni o\'chirmoqchimisiz?')) {
      await deleteLocalSong(songId);
      setLocalSongs(getLocalSongs());
    }
  };

  const handleUploadComplete = (newSong: Song) => {
    setLocalSongs([...localSongs, newSong]);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const allSongs = [...localSongs, ...onlineSongs];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Musiqa Pleyer</h1>
              <p className="text-sm text-muted-foreground">
                {allSongs.length} ta qo'shiq
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

        {/* Upload Button */}
        <div className="mb-6">
          <FileUpload onUploadComplete={handleUploadComplete} />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="local">
              Telefon xotirasi ({localSongs.length})
            </TabsTrigger>
            <TabsTrigger value="online">
              Onlayn ({onlineSongs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="local" className="space-y-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="w-14 h-14 rounded-md bg-muted" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48 bg-muted" />
                    <Skeleton className="h-4 w-32 bg-muted" />
                  </div>
                  <Skeleton className="h-4 w-12 bg-muted" />
                </div>
              ))
            ) : localSongs.length === 0 ? (
              <div className="text-center py-12">
                <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Telefon xotirasida musiqa yo'q</p>
                <p className="text-sm text-muted-foreground">
                  "Musiqa yuklash" tugmasini bosib qo'shiq qo'shing
                </p>
              </div>
            ) : (
              localSongs.map((song) => (
                <div key={song.id} className="relative group">
                  <SongItem
                    song={song}
                    isPlaying={currentSong?.id === song.id && isPlaying}
                    onClick={() => handleSongClick(song, localSongs)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteLocal(song.id, e)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="online" className="space-y-2">
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
            ) : onlineSongs.length === 0 ? (
              <div className="text-center py-12">
                <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Onlayn qo'shiqlar yo'q</p>
              </div>
            ) : (
              onlineSongs.map((song) => (
                <SongItem
                  key={song.id}
                  song={song}
                  isPlaying={currentSong?.id === song.id && isPlaying}
                  onClick={() => handleSongClick(song, onlineSongs)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Now Playing Bar */}
        {currentSong && (
          <div
            onClick={() => navigate('/player')}
            className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 cursor-pointer hover:bg-accent/5 transition-colors"
          >
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              <img
                src={currentSong.localAlbumArtUrl || currentSong.album_art_url || '/placeholder-album.png'}
                alt={currentSong.title}
                className="w-12 h-12 rounded-md object-cover bg-muted"
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
