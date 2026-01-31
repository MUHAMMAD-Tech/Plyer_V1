import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Moon, Sun, FolderOpen, RefreshCw } from 'lucide-react';
import { songsApi } from '@/db/api';
import { useAudio } from '@/contexts/AudioContext';
import { SongItem } from '@/components/music/SongItem';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTheme } from 'next-themes';
import type { Song } from '@/types';
import { 
  initIndexedDB,
  getDirectoryHandle,
  requestMusicDirectoryAccess,
  verifyDirectoryPermission,
  scanMusicDirectory,
  clearDirectoryAccess
} from '@/db/localStorageDb';

export default function MusicList() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { currentSong, playSong, isPlaying } = useAudio();
  const [onlineSongs, setOnlineSongs] = useState<Song[]>([]);
  const [localSongs, setLocalSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [hasDirectoryAccess, setHasDirectoryAccess] = useState(false);
  const [activeTab, setActiveTab] = useState('local');

  useEffect(() => {
    loadAllSongs();
  }, []);

  const loadAllSongs = async () => {
    setLoading(true);
    
    // Initialize IndexedDB
    await initIndexedDB();
    
    // Check if this is first time user
    const hasAskedPermission = localStorage.getItem('music-permission-asked');
    
    if (!hasAskedPermission) {
      // First time - show permission dialog
      const userConsent = confirm(
        'Telefon xotirangizdagi barcha musiqalarga kirish uchun ruxsat berasizmi?\n\n' +
        'Ha - Barcha musiqalaringiz avtomatik yuklanadi\n' +
        'Yo\'q - Faqat onlayn musiqalardan foydalanasiz'
      );
      
      localStorage.setItem('music-permission-asked', 'true');
      
      if (userConsent) {
        // User agreed - request directory access
        const dirHandle = await requestMusicDirectoryAccess();
        if (dirHandle) {
          setHasDirectoryAccess(true);
          await scanDirectory(dirHandle);
        }
      }
    } else {
      // Not first time - check for existing directory access
      const dirHandle = await getDirectoryHandle();
      if (dirHandle) {
        const hasPermission = await verifyDirectoryPermission(dirHandle);
        if (hasPermission) {
          setHasDirectoryAccess(true);
          // Automatically scan directory
          await scanDirectory(dirHandle);
        } else {
          setHasDirectoryAccess(false);
        }
      }
    }
    
    // Load online songs
    const online = await songsApi.getAllSongs();
    setOnlineSongs(online);
    
    setLoading(false);
  };

  const scanDirectory = async (dirHandle: FileSystemDirectoryHandle) => {
    setScanning(true);
    console.log('Papkani skanerlash boshlandi');
    try {
      const songs = await scanMusicDirectory(dirHandle);
      console.log(`Skanerlash tugadi: ${songs.length} ta qo'shiq topildi`);
      setLocalSongs(songs);
      
      if (songs.length === 0) {
        alert('Tanlangan papkada audio fayllar topilmadi. Iltimos, musiqa fayllari bo\'lgan papkani tanlang.');
      }
    } catch (error) {
      console.error('Papkani skanerlashda xatolik:', error);
      alert('Papkani skanerlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
    } finally {
      setScanning(false);
    }
  };

  const handleRequestAccess = async () => {
    const dirHandle = await requestMusicDirectoryAccess();
    if (dirHandle) {
      setHasDirectoryAccess(true);
      await scanDirectory(dirHandle);
    }
  };

  const handleRescan = async () => {
    const dirHandle = await getDirectoryHandle();
    if (dirHandle) {
      const hasPermission = await verifyDirectoryPermission(dirHandle);
      if (hasPermission) {
        await scanDirectory(dirHandle);
      } else {
        setHasDirectoryAccess(false);
        alert('Papkaga kirish huquqi yo\'q. Iltimos, qaytadan ruxsat bering.');
      }
    }
  };

  const handleRevokeAccess = async () => {
    if (confirm('Musiqa papkasiga kirishni bekor qilmoqchimisiz?')) {
      await clearDirectoryAccess();
      setHasDirectoryAccess(false);
      setLocalSongs([]);
    }
  };

  const handleSongClick = async (song: Song, playlist?: Song[]) => {
    playSong(song, playlist || [...localSongs, ...onlineSongs]);
    navigate('/player');
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

        {/* Directory Access Section */}
        {!hasDirectoryAccess && !loading && (
          <Alert className="mb-6">
            <FolderOpen className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Telefon xotirasidagi musiqalarni ko'rish uchun papkaga ruxsat bering</span>
              <Button onClick={handleRequestAccess} size="sm" className="ml-4">
                Ruxsat berish
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {hasDirectoryAccess && (
          <div className="mb-6 flex gap-2">
            <Button onClick={handleRescan} variant="outline" size="sm" disabled={scanning}>
              <RefreshCw className={`w-4 h-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Skanerlanyapti...' : 'Qayta skanerlash'}
            </Button>
            <Button onClick={handleRevokeAccess} variant="outline" size="sm">
              Ruxsatni bekor qilish
            </Button>
          </div>
        )}

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
            {loading || scanning ? (
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
            ) : !hasDirectoryAccess ? (
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Telefon xotirasiga kirish yo'q</p>
                <p className="text-sm text-muted-foreground">
                  Yuqoridagi "Ruxsat berish" tugmasini bosing
                </p>
              </div>
            ) : localSongs.length === 0 ? (
              <div className="text-center py-12">
                <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Musiqa fayllari topilmadi</p>
                <p className="text-sm text-muted-foreground">
                  Tanlangan papkada audio fayllar yo'q
                </p>
              </div>
            ) : (
              localSongs.map((song) => (
                <SongItem
                  key={song.id}
                  song={song}
                  isPlaying={currentSong?.id === song.id && isPlaying}
                  onClick={() => handleSongClick(song, localSongs)}
                />
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
