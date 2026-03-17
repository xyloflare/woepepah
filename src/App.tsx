import { useState } from "react";
import { useWallpaperManager } from "./hooks/useWallpaperManager";
import WallpaperGrid from "./components/WallpaperGrid";
import SearchBar from "./components/SearchBar";
import Settings from "./components/Settings";
import Toolbar from "./components/Toolbar";
import "./App.css"

export default function App() {
  const mgr = useWallpaperManager();
  const [query, setQuery] = useState("");
  const [showFavs, setShowFavs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const filtered = mgr.wallpapers
    .filter((w) => (!showFavs || w.isFavorite))
    .filter((w) => w.filename.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="app">
      <Toolbar
        dir={mgr.config?.wallpaper_dir ?? null}
        onPickFolder={mgr.pickFolder}
        showFavs={showFavs}
        onToggleFavs={() => setShowFavs((v) => !v)}
        onOpenSettings={() => setShowSettings(true)}
      />
      <SearchBar value={query} onChange={setQuery} />
      <WallpaperGrid
        wallpapers={filtered}
        activeWallpaper={mgr.active}
        loading={mgr.loading}
        onApply={mgr.applyWallpaper}
        onToggleFavorite={mgr.toggleFavorite}
      />
      {showSettings && mgr.config && (
        <Settings
          command={mgr.config.set_command}
          onSave={mgr.updateCommand}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
