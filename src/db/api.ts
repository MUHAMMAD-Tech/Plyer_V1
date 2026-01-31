import { supabase } from './supabase';
import type { Song } from '@/types';

export const songsApi = {
  // Get all songs
  getAllSongs: async (): Promise<Song[]> => {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching songs:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  // Get song by ID
  getSongById: async (id: string): Promise<Song | null> => {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching song:', error);
      return null;
    }

    return data;
  },
};
