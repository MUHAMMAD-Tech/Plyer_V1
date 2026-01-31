import { useState } from 'react';
import { Upload, X, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Song } from '@/types';
import { storeAudioFile, storeImageFile, saveLocalSongs, getLocalSongs } from '@/db/localStorageDb';

interface FileUploadProps {
  onUploadComplete: (song: Song) => void;
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [open, setOpen] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      // Auto-fill title from filename if empty
      if (!title) {
        const name = file.name.replace(/\.[^/.]+$/, '');
        setTitle(name);
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !title || !artist) return;

    setLoading(true);
    try {
      // Get audio duration
      const duration = await getAudioDuration(audioFile);
      
      // Generate unique ID
      const id = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Store files in IndexedDB
      await storeAudioFile(id, audioFile);
      if (imageFile) {
        await storeImageFile(id, imageFile);
      }

      // Create song object
      const newSong: Song = {
        id,
        title,
        artist,
        duration: Math.floor(duration),
        is_local: true,
        file_name: audioFile.name,
      };

      // Save to localStorage
      const existingSongs = getLocalSongs();
      saveLocalSongs([...existingSongs, newSong]);

      // Notify parent
      onUploadComplete(newSong);

      // Reset form
      setAudioFile(null);
      setImageFile(null);
      setTitle('');
      setArtist('');
      setOpen(false);
    } catch (error) {
      console.error('Fayl yuklashda xatolik:', error);
      alert('Fayl yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="w-4 h-4" />
          Musiqa yuklash
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Telefon xotirasidan musiqa yuklash</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Audio File */}
          <div className="space-y-2">
            <Label htmlFor="audio">Audio fayl *</Label>
            <div className="relative">
              <Input
                id="audio"
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                className="cursor-pointer"
                required
              />
              {audioFile && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Music className="w-4 h-4" />
                  <span className="truncate">{audioFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => setAudioFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Album Art */}
          <div className="space-y-2">
            <Label htmlFor="image">Albom rasmi (ixtiyoriy)</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="cursor-pointer"
            />
            {imageFile && (
              <div className="mt-2">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  className="w-24 h-24 rounded-md object-cover"
                />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Qo'shiq nomi *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Qo'shiq nomini kiriting"
              required
            />
          </div>

          {/* Artist */}
          <div className="space-y-2">
            <Label htmlFor="artist">Ijrochi *</Label>
            <Input
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Ijrochi nomini kiriting"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!audioFile || !title || !artist || loading}
            >
              {loading ? 'Yuklanmoqda...' : 'Saqlash'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
