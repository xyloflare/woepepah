import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen }  from "@tauri-apps/api/event";
import type { Config, Wallpaper } from "../types";

export function useWallpaperManager() {
  const [config,     setConfig]     = useState<Config | null>(null);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [active,     setActive]     = useState<string | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    invoke<Config>("get_config").then(setConfig);
  }, []);

  useEffect(() => {
    if (!config?.wallpaper_dir) return;

    // Tear down previous event listener
    unlistenRef.current?.();

    setLoading(true);

    let paths: string[] = [];

    // 1. Scan directory
    invoke<string[]>("scan_directory", { dir: config.wallpaper_dir })
      .then(async (scanned) => {
        paths = scanned;

        // Initialise grid immediately — no thumbs yet
        setWallpapers(
          paths.map((p) => ({
            path:       p,
            filename:   p.split("/").pop() ?? p,
            isFavorite: config.favorites.includes(p),
            thumbPath:  null,
          }))
        );
        setLoading(false);

        // 2. Listen for thumbnails streamed back from Rust
        const unlisten = await listen<{ original: string; thumb: string }>(
          "thumbnail-ready",
          ({ payload }) => {
            setWallpapers((ws) =>
              ws.map((w) =>
                w.path === payload.original
                  ? { ...w, thumbPath: payload.thumb }
                  : w
              )
            );
          }
        );
        unlistenRef.current = unlisten;

        // 3. Kick off parallel thumbnail generation in Rust
        await invoke("generate_thumbnails", { paths });
      })
      .finally(() => setLoading(false));

    return () => { unlistenRef.current?.(); };
  }, [config?.wallpaper_dir]);

  const pickFolder = useCallback(async () => {
    const dir = await invoke<string | null>("pick_folder");
    if (!dir || !config) return;
    const next = { ...config, wallpaper_dir: dir };
    setConfig(next);
    await invoke("save_config", { config: next });
  }, [config]);

  const applyWallpaper = useCallback(async (path: string) => {
    if (!config) return;
    await invoke("apply_wallpaper", { path, commandTemplate: config.set_command });
    setActive(path);
  }, [config]);

  const toggleFavorite = useCallback(async (path: string) => {
    if (!config) return;
    const favs = config.favorites.includes(path)
      ? config.favorites.filter((f) => f !== path)
      : [...config.favorites, path];
    const next = { ...config, favorites: favs };
    setConfig(next);
    setWallpapers((ws) =>
      ws.map((w) => (w.path === path ? { ...w, isFavorite: !w.isFavorite } : w))
    );
    await invoke("save_config", { config: next });
  }, [config]);

  const updateCommand = useCallback(async (cmd: string) => {
    if (!config) return;
    const next = { ...config, set_command: cmd };
    setConfig(next);
    await invoke("save_config", { config: next });
  }, [config]);

  return {
    config, wallpapers, loading, active,
    pickFolder, applyWallpaper, toggleFavorite, updateCommand,
  };
}
