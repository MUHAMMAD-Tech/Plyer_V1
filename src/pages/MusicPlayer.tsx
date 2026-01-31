import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, Music } from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function MusicPlayer() {
  const navigate = useNavigate();
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
  } = useAudio();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  useEffect(() => {
    if (!currentSong) {
      navigate('/');
    }
  }, [currentSong, navigate]);

  useEffect(() => {
    if (!isSeeking) {
      setSeekValue(currentTime);
    }
  }, [currentTime, isSeeking]);

  if (!currentSong) {
    return null;
  }

  const handleSeekChange = (value: number[]) => {
    setIsSeeking(true);
    setSeekValue(value[0]);
  };

  const handleSeekCommit = (value: number[]) => {
    seekTo(value[0]);
    setIsSeeking(false);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Album Art */}
        <div className="relative mb-8 animate-fade-in">
          <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl bg-muted">
            {currentSong.localAlbumArtUrl || currentSong.album_art_url ? (
              <img
                src={currentSong.localAlbumArtUrl || currentSong.album_art_url}
                alt={currentSong.title}
                className={cn(
                  'w-full h-full object-cover transition-transform duration-300',
                  isPlaying && 'scale-105'
                )}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-32 h-32 text-muted-foreground" />
              </div>
            )}
          </div>
          {/* Glow effect */}
          <div
            className="absolute inset-0 -z-10 blur-3xl opacity-30"
            style={{
              background: `radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)`,
            }}
          />
        </div>

        {/* Song Info */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{currentSong.title}</h1>
          <p className="text-lg text-muted-foreground">{currentSong.artist}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <Slider
            value={[isSeeking ? seekValue : currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeekChange}
            onValueCommit={handleSeekCommit}
            className="cursor-pointer"
          />
        </div>

        {/* Time Display */}
        <div className="flex justify-between text-sm text-muted-foreground mb-8">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={playPrevious}
            className="w-14 h-14 rounded-full"
          >
            <SkipBack className="w-5 h-5" />
          </Button>

          <Button
            size="icon"
            onClick={togglePlayPause}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" fill="currentColor" />
            ) : (
              <Play className="w-8 h-8 ml-1" fill="currentColor" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={playNext}
            className="w-14 h-14 rounded-full"
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVolume(volume > 0 ? 0 : 1)}
            className="shrink-0"
          >
            {volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="flex-1"
          />
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-sm">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">
              {Math.round(progress)}% played
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
