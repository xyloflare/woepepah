import { convertFileSrc } from "@tauri-apps/api/core";
import type { Wallpaper } from "../types";

function WallpaperCard({
  w, isActive, onApply, onToggleFavorite,
}: {
  w: Wallpaper;
  isActive: boolean;
  onApply: (p: string) => void;
  onToggleFavorite: (p: string) => void;
}) {
  const src = w.thumbPath ? convertFileSrc(w.thumbPath) : null;

  return (
    <div
      className={`card ${isActive ? "card--active" : ""} ${!src ? "card--loading" : ""}`}
      onClick={() => onApply(w.path)}
    >
      {src && (
        <img
          src={src}
          alt={w.filename}
          decoding="async"
        />
      )}
      <div className="card__overlay">
        <span className="card__name">{w.filename}</span>
        <button
          className={`card__fav ${w.isFavorite ? "card__fav--on" : ""}`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(w.path); }}
          title={w.isFavorite ? "Unpin" : "Pin"}
        >
          {w.isFavorite ? "★" : "☆"}
        </button>
      </div>
    </div>
  );
}

export default function WallpaperGrid({ wallpapers, activeWallpaper, loading, onApply, onToggleFavorite }: {
  wallpapers: Wallpaper[];
  activeWallpaper: string | null;
  loading: boolean;
  onApply: (p: string) => void;
  onToggleFavorite: (p: string) => void;
}) {
  if (loading)          return <div className="status">Scanning…</div>;
  if (!wallpapers.length) return <div className="status">No wallpapers found.</div>;

  return (
    <div className="grid">
      {wallpapers.map((w) => (
        <WallpaperCard
          key={w.path}
          w={w}
          isActive={activeWallpaper === w.path}
          onApply={onApply}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
