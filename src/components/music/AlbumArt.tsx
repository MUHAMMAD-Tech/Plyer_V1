import { Music } from 'lucide-react';
import { useMemo } from 'react';

interface AlbumArtProps {
  src?: string;
  alt: string;
  className?: string;
  seedText?: string; // Gradient uchun seed (song ID yoki title)
  showIcon?: boolean; // Gradient ustida musiqa ikonkasini ko'rsatish
}

// Turli xil gradient kombinatsiyalari
const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f77062 0%, #fe5196 100%)',
  'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)',
  'linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)',
  'linear-gradient(135deg, #feada6 0%, #f5efef 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
  'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)',
  'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
];

// String'dan raqam olish (gradient tanlash uchun)
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function AlbumArt({ 
  src, 
  alt, 
  className = '', 
  seedText = '',
  showIcon = true 
}: AlbumArtProps) {
  // Gradient tanlash
  const gradient = useMemo(() => {
    const hash = hashString(seedText || alt);
    const index = hash % gradients.length;
    return gradients[index];
  }, [seedText, alt]);

  // Agar rasm bo'lsa, rasmni ko'rsatish
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`object-cover bg-muted ${className}`}
        onError={(e) => {
          // Agar rasm yuklanmasa, gradient ko'rsatish
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) {
            parent.style.background = gradient;
            if (showIcon) {
              const icon = document.createElement('div');
              icon.className = 'absolute inset-0 flex items-center justify-center';
              icon.innerHTML = '<svg class="w-1/2 h-1/2 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>';
              parent.appendChild(icon);
            }
          }
        }}
      />
    );
  }

  // Agar rasm bo'lmasa, gradient bilan ko'rsatish
  return (
    <div
      className={`relative ${className}`}
      style={{ background: gradient }}
    >
      {showIcon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Music className="w-1/2 h-1/2 text-white/80" />
        </div>
      )}
    </div>
  );
}
