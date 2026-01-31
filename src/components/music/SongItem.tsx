import { Music2, Play } from 'lucide-react';
import type { Song } from '@/types';
import { cn } from '@/lib/utils';
import { AlbumArt } from './AlbumArt';

interface SongItemProps {
  song: Song;
  isPlaying?: boolean;
  onClick: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SongItem({ song, isPlaying, onClick }: SongItemProps) {
  const albumArtUrl = song.localAlbumArtUrl || song.album_art_url;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all duration-200',
        'hover:bg-accent/10 hover:shadow-md',
        isPlaying && 'bg-primary/10 border border-primary/20'
      )}
    >
      <div className="relative shrink-0">
        <AlbumArt
          src={albumArtUrl}
          alt={song.title}
          seedText={song.id}
          className="w-14 h-14 rounded-md"
          showIcon={true}
        />
        <div
          className={cn(
            'absolute inset-0 bg-black/40 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity',
            isPlaying && 'opacity-100'
          )}
        >
          {isPlaying ? (
            <Music2 className="w-6 h-6 text-white animate-pulse" />
          ) : (
            <Play className="w-6 h-6 text-white" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={cn('font-semibold truncate', isPlaying && 'text-primary')}>
          {song.title}
        </h3>
        <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
      </div>

      <div className="text-sm text-muted-foreground shrink-0">
        {formatDuration(song.duration)}
      </div>
    </div>
  );
}
