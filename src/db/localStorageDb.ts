import type { Song } from '@/types';

const LOCAL_SONGS_KEY = 'local-songs';
const LOCAL_FILES_KEY = 'local-files';

// IndexedDB setup for storing audio files
const DB_NAME = 'MusicPlayerDB';
const DB_VERSION = 1;
const AUDIO_STORE = 'audioFiles';
const IMAGE_STORE = 'imageFiles';

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
    };
  });
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
