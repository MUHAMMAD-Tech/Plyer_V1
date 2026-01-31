import type { Song } from '@/types';

const LOCAL_SONGS_KEY = 'local-songs';
const DIRECTORY_HANDLE_KEY = 'music-directory-handle';

// IndexedDB setup for storing audio files and directory handle
const DB_NAME = 'MusicPlayerDB';
const DB_VERSION = 2;
const AUDIO_STORE = 'audioFiles';
const IMAGE_STORE = 'imageFiles';
const HANDLE_STORE = 'directoryHandles';

let db: IDBDatabase | null = null;

// Initialize IndexedDB
export async function initIndexedDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains(AUDIO_STORE)) {
        database.createObjectStore(AUDIO_STORE);
      }
      
      if (!database.objectStoreNames.contains(IMAGE_STORE)) {
        database.createObjectStore(IMAGE_STORE);
      }

      if (!database.objectStoreNames.contains(HANDLE_STORE)) {
        database.createObjectStore(HANDLE_STORE);
      }
    };
  });
}

// Store directory handle
export async function storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  if (!db) await initIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([HANDLE_STORE], 'readwrite');
    const store = transaction.objectStore(HANDLE_STORE);
    const request = store.put(handle, DIRECTORY_HANDLE_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get directory handle
export async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (!db) await initIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([HANDLE_STORE], 'readonly');
    const store = transaction.objectStore(HANDLE_STORE);
    const request = store.get(DIRECTORY_HANDLE_KEY);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Request permission to access music directory
export async function requestMusicDirectoryAccess(): Promise<FileSystemDirectoryHandle | null> {
  try {
    // Check if File System Access API is supported
    if (!('showDirectoryPicker' in window)) {
      alert('Sizning brauzeringiz fayl tizimiga kirishni qo\'llab-quvvatlamaydi. Iltimos, Chrome, Edge yoki boshqa zamonaviy brauzerdan foydalaning.');
      return null;
    }

    const dirHandle = await (window as any).showDirectoryPicker({
      mode: 'read',
      startIn: 'music',
    });

    // Store the handle for future use
    await storeDirectoryHandle(dirHandle);
    
    return dirHandle;
  } catch (error: any) {
    // User cancelled the picker
    if (error.name === 'AbortError') {
      console.log('Foydalanuvchi papka tanlashni bekor qildi');
    } else {
      console.error('Musiqa papkasiga kirish rad etildi:', error);
    }
    return null;
  }
}

// Verify permission for stored directory handle
export async function verifyDirectoryPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  try {
    const permission = await handle.queryPermission({ mode: 'read' });
    if (permission === 'granted') {
      return true;
    }

    const requestPermission = await handle.requestPermission({ mode: 'read' });
    return requestPermission === 'granted';
  } catch {
    return false;
  }
}

// Scan directory for music files
export async function scanMusicDirectory(dirHandle: FileSystemDirectoryHandle): Promise<Song[]> {
  const songs: Song[] = [];
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

  try {
    // Collect all files
    const files: { file: File; path: string }[] = [];
    
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const file = await (entry as FileSystemFileHandle).getFile();
        const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
        
        if (audioExtensions.includes(ext)) {
          files.push({ file, path: file.name });
        }
      }
    }

    // Process each audio file
    for (const { file, path } of files) {
      try {
        const duration = await getAudioDuration(file);
        const metadata = await extractMetadata(file);
        
        const id = `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Try to find album art in the same directory
        let albumArtUrl: string | undefined;
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file') {
            const artFile = await (entry as FileSystemFileHandle).getFile();
            const ext = artFile.name.toLowerCase().slice(artFile.name.lastIndexOf('.'));
            const baseName = artFile.name.toLowerCase();
            
            if (imageExtensions.includes(ext) && 
                (baseName.includes('cover') || baseName.includes('album') || baseName.includes('art'))) {
              albumArtUrl = URL.createObjectURL(artFile);
              break;
            }
          }
        }

        const song: Song = {
          id,
          title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
          artist: metadata.artist || 'Noma\'lum ijrochi',
          duration: Math.floor(duration),
          is_local: true,
          file_name: file.name,
          localAudioUrl: URL.createObjectURL(file),
          localAlbumArtUrl: albumArtUrl,
        };

        songs.push(song);
      } catch (error) {
        console.error(`Faylni qayta ishlashda xatolik: ${path}`, error);
      }
    }

    // Save to localStorage
    saveLocalSongs(songs);
    
    return songs;
  } catch (error) {
    console.error('Musiqa papkasini skanerlashda xatolik:', error);
    return [];
  }
}

// Get audio duration
function getAudioDuration(file: File): Promise<number> {
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
}

// Extract metadata from audio file
async function extractMetadata(file: File): Promise<{ title?: string; artist?: string }> {
  // Basic metadata extraction from filename
  // Format: "Artist - Title.mp3" or "Title.mp3"
  const fileName = file.name.replace(/\.[^/.]+$/, '');
  
  if (fileName.includes(' - ')) {
    const [artist, title] = fileName.split(' - ');
    return { artist: artist.trim(), title: title.trim() };
  }
  
  return { title: fileName };
}

// Store audio file in IndexedDB
export async function storeAudioFile(id: string, file: File): Promise<void> {
  if (!db) await initIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([AUDIO_STORE], 'readwrite');
    const store = transaction.objectStore(AUDIO_STORE);
    const request = store.put(file, id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Store image file in IndexedDB
export async function storeImageFile(id: string, file: File): Promise<void> {
  if (!db) await initIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([IMAGE_STORE], 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE);
    const request = store.put(file, id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get audio file from IndexedDB
export async function getAudioFile(id: string): Promise<File | null> {
  if (!db) await initIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([AUDIO_STORE], 'readonly');
    const store = transaction.objectStore(AUDIO_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Get image file from IndexedDB
export async function getImageFile(id: string): Promise<File | null> {
  if (!db) await initIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([IMAGE_STORE], 'readonly');
    const store = transaction.objectStore(IMAGE_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Delete audio file from IndexedDB
export async function deleteAudioFile(id: string): Promise<void> {
  if (!db) await initIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([AUDIO_STORE], 'readwrite');
    const store = transaction.objectStore(AUDIO_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Delete image file from IndexedDB
export async function deleteImageFile(id: string): Promise<void> {
  if (!db) await initIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([IMAGE_STORE], 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Save local songs metadata to localStorage
export function saveLocalSongs(songs: Song[]): void {
  const songsData = songs.map(song => ({
    id: song.id,
    title: song.title,
    artist: song.artist,
    duration: song.duration,
    is_local: song.is_local,
    file_name: song.file_name,
  }));
  localStorage.setItem(LOCAL_SONGS_KEY, JSON.stringify(songsData));
}

// Get local songs metadata from localStorage
export function getLocalSongs(): Song[] {
  const data = localStorage.getItem(LOCAL_SONGS_KEY);
  if (!data) return [];
  
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Delete local song
export async function deleteLocalSong(id: string): Promise<void> {
  const songs = getLocalSongs();
  const updatedSongs = songs.filter(s => s.id !== id);
  saveLocalSongs(updatedSongs);
  
  await deleteAudioFile(id);
  await deleteImageFile(id);
}

// Clear directory handle (revoke access)
export async function clearDirectoryAccess(): Promise<void> {
  if (!db) await initIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([HANDLE_STORE], 'readwrite');
    const store = transaction.objectStore(HANDLE_STORE);
    const request = store.delete(DIRECTORY_HANDLE_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
