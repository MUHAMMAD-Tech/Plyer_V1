import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Moon, Sun, Upload, RefreshCw } from 'lucide-react';
import { songsApi } from '@/db/api';
import { useAudio } from '@/contexts/AudioContext';
import { SongItem } from '@/components/music/SongItem';
import { AlbumArt } from '@/components/music/AlbumArt';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from 'next-themes';
import type { Song } from '@/types';
import { 
  initIndexedDB,
  saveLocalSongs,
  getLocalSongs,
} from '@/db/localStorageDb';

export default function MusicList() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { currentSong, playSong, isPlaying } = useAudio();
  const [onlineSongs, setOnlineSongs] = useState<Song[]>([]);
  const [localSongs, setLocalSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('local');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        'Telefon xotirangizdagi musiqalarni qo\'lda yuklashni xohlaysizmi?\n\n' +
        'Ha - Musiqa fayllarini tanlash oynasi ochiladi\n' +
        'Yo\'q - Faqat onlayn musiqalardan foydalanasiz'
      );
      
      localStorage.setItem('music-permission-asked', 'true');
      
      if (userConsent) {
        // User agreed - open file picker
        setTimeout(() => {
          fileInputRef.current?.click();
        }, 500);
      }
    } else {
      // Load existing local songs
      const local = getLocalSongs();
      setLocalSongs(local);
    }
    
    // Load online songs
    const online = await songsApi.getAllSongs();
    setOnlineSongs(online);
    
    setLoading(false);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    console.log(`=== ${files.length} ta fayl tanlandi ===`);

    const newSongs: Song[] = [];
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma', '.opus', '.webm'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[${i + 1}/${files.length}] Fayl: ${file.name}`);

      try {
        // Check if it's an audio file
        const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
        if (!audioExtensions.includes(ext)) {
          console.log(`O'tkazib yuborildi (audio emas): ${file.name}`);
          continue;
        }

        // Get duration
        const duration = await getAudioDuration(file);
        
        // Extract metadata from filename
        const metadata = extractMetadata(file.name);
        
        const id = `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const song: Song = {
          id,
          title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
          artist: metadata.artist || 'Noma\'lum ijrochi',
          duration: Math.floor(duration),
          is_local: true,
          file_name: file.name,
          localAudioUrl: URL.createObjectURL(file),
        };

        console.log(`✓ Qo'shiq qo'shildi: ${song.title}`);
        newSongs.push(song);
      } catch (error) {
        console.error(`✗ Xatolik: ${file.name}`, error);
      }
    }

    console.log(`=== Jami ${newSongs.length} ta qo'shiq yuklandi ===`);

    if (newSongs.length > 0) {
      const updatedSongs = [...localSongs, ...newSongs];
      setLocalSongs(updatedSongs);
      saveLocalSongs(updatedSongs);
      alert(`${newSongs.length} ta qo'shiq muvaffaqiyatli yuklandi!`);
    } else {
      alert('Hech qanday audio fayl topilmadi. Iltimos, audio fayllarni tanlang.');
    }

    setUploading(false);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
        URL.revokeObjectURL(audio.src);
      };
      audio.onerror = () => {
        resolve(180); // Default 3 minutes if error
        URL.revokeObjectURL(audio.src);
      };
      audio.src = URL.createObjectURL(file);
    });
  };

  const extractMetadata = (fileName: string): { title?: string; artist?: string } => {
    // Remove extension
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    
    // Format: "Artist - Title" or "Title"
    if (nameWithoutExt.includes(' - ')) {
      const [artist, title] = nameWithoutExt.split(' - ');
      return { artist: artist.trim(), title: title.trim() };
    }
    
    return { title: nameWithoutExt };
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearLocal = () => {
    if (confirm('Barcha mahalliy musiqalarni o\'chirmoqchimisiz?')) {
      setLocalSongs([]);
      saveLocalSongs([]);
      alert('Barcha mahalliy musiqalar o\'chirildi');
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

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload Controls */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Button 
            onClick={handleUploadClick} 
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Yuklanmoqda...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Musiqa yuklash
              </>
            )}
          </Button>
          
          {localSongs.length > 0 && (
            <Button 
              onClick={handleClearLocal} 
              variant="outline"
              size="sm"
            >
              Hammasini tozalash
            </Button>
          )}
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
            {loading || uploading ? (
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
                <p className="text-sm text-muted-foreground mb-4">
                  "Musiqa yuklash" tugmasini bosib qo'shiqlarni tanlang
                </p>
                <Button onClick={handleUploadClick} variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Musiqa yuklash
                </Button>
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
              <AlbumArt
                src={currentSong.localAlbumArtUrl || currentSong.album_art_url}
                alt={currentSong.title}
                seedText={currentSong.id}
                className="w-12 h-12 rounded-md"
                showIcon={false}
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
