export interface Config {
  wallpaper_dir: string | null;
  set_command: string;
  favorites: string[];
}

export interface Wallpaper {
  path: string;       // full absolute path
  filename: string;   // display name
  isFavorite: boolean;
}
export interface Wallpaper {
  path:       string;
  filename:   string;
  isFavorite: boolean;
  thumbPath:  string | null;   // ← add
}
