-- Create songs table
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  duration INTEGER NOT NULL, -- Duration in seconds
  audio_url TEXT NOT NULL,
  album_art_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for album art
INSERT INTO storage.buckets (id, name, public)
VALUES ('album-art', 'album-art', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to songs
CREATE POLICY "Allow public read access to songs"
ON songs FOR SELECT
TO public
USING (true);

-- Storage policies for audio files
CREATE POLICY "Allow public read access to audio files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio-files');

-- Storage policies for album art
CREATE POLICY "Allow public read access to album art"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'album-art');

-- Insert sample songs
INSERT INTO songs (title, artist, duration, audio_url, album_art_url) VALUES
('Midnight Dreams', 'Luna Eclipse', 245, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_ad55b1ef-1188-4b56-a1aa-abb0b9ee2da5.jpg'),
('Electric Pulse', 'Neon Waves', 198, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_e30d5f19-7fd1-4703-8796-8ca05f4d958d.jpg'),
('Sunset Boulevard', 'The Wanderers', 267, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_40797d46-adb4-4205-886c-2d7583fa166c.jpg'),
('Jazz Cafe', 'Smooth Trio', 312, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_619a63b6-ee9e-4f4e-98d9-3507d40236d2.jpg'),
('Symphony No. 5', 'Classical Ensemble', 423, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_a6533537-a3c7-4329-bf38-1d1d087a4426.jpg');