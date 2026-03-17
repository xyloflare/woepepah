use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use sha2::{Sha256, Digest};
use std::sync::Arc;
use tauri::Emitter;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Config {
    pub wallpaper_dir: Option<String>,
    pub set_command: String,
    pub favorites: Vec<String>,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            wallpaper_dir: None,
            set_command: "swww img {path} --transition-type wipe --transition-duration 2".into(),
            favorites: vec![],
        }
    }
}

fn config_path() -> PathBuf {
    let mut p = dirs::config_dir().unwrap_or_else(|| PathBuf::from("~/.config"));
    p.push("wallpaper-manager");
    fs::create_dir_all(&p).ok();
    p.push("config.json");
    p
}

#[tauri::command]
pub fn get_config() -> Config {
    let path = config_path();
    if let Ok(data) = fs::read_to_string(&path) {
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        Config::default()
    }
}

#[tauri::command]
pub fn save_config(config: Config) -> Result<(), String> {
    let path = config_path();
    let data = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(path, data).map_err(|e| e.to_string())
}

const IMAGE_EXTS: &[&str] = &["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff"];

#[tauri::command]
pub fn scan_directory(dir: String) -> Vec<String> {
    let Ok(entries) = fs::read_dir(&dir) else { return vec![] };
    let mut paths: Vec<String> = entries
        .flatten()
        .filter(|e| {
            let p = e.path();
            p.is_file()
                && p.extension()
                    .and_then(|ext| ext.to_str())
                    .map(|ext| IMAGE_EXTS.contains(&ext.to_lowercase().as_str()))
                    .unwrap_or(false)
        })
        .map(|e| e.path().to_string_lossy().to_string())
        .collect();
    paths.sort();
    paths
}

#[tauri::command]
pub fn apply_wallpaper(path: String, command_template: String) -> Result<(), String> {
    let cmd = command_template.replace("{path}", &path);
    let parts: Vec<&str> = cmd.split_whitespace().collect();
    let (exe, args) = parts.split_first().ok_or("Empty command")?;
    Command::new(exe)
        .args(args)
        .spawn()
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pick_folder(app: tauri::AppHandle) -> Option<String> {
    use tauri_plugin_dialog::DialogExt;
    app.dialog()
        .file()
        .set_title("Select wallpaper folder")
        .blocking_pick_folder()
        .map(|p| p.to_string())
}

fn thumb_cache_dir() -> PathBuf {
    let mut p = dirs::cache_dir().unwrap_or_else(|| PathBuf::from("/tmp"));
    p.push("wallpaper-manager");
    p.push("thumbs");
    fs::create_dir_all(&p).ok();
    p
}

fn thumb_path_for(original: &str) -> PathBuf {
    let hash = format!("{:x}", Sha256::digest(original.as_bytes()));
    thumb_cache_dir().join(format!("{}.jpg", &hash[..20]))
}

fn is_stale(original: &str, thumb: &PathBuf) -> bool {
    if !thumb.exists() { return true; }
    let src_mtime  = fs::metadata(original).and_then(|m| m.modified()).ok();
    let thb_mtime  = fs::metadata(thumb).and_then(|m| m.modified()).ok();
    match (src_mtime, thb_mtime) {
        (Some(s), Some(t)) => s > t,
        _ => true,
    }
}

// ── Event payload ────────────────────────────────────────────────────────────

#[derive(Clone, Serialize)]
pub struct ThumbnailReady {
    pub original: String,
    pub thumb:    String,
}

#[tauri::command]
pub async fn generate_thumbnails(
    app: tauri::AppHandle,
    paths: Vec<String>,
) -> Result<(), String> {
    use rayon::prelude::*;

    let app = Arc::new(app);

    tauri::async_runtime::spawn_blocking(move || {
        let pool = rayon::ThreadPoolBuilder::new()
            .num_threads(2)
            .build()
            .map_err(|e| e.to_string())?;

        pool.install(|| {
            paths.par_iter().for_each(|original| {
                let thumb = thumb_path_for(original);

                if is_stale(original, &thumb) {
                    if let Ok(img) = image::open(original) {
                        let t = img.thumbnail(390, 230);
                        let _ = t.save_with_format(&thumb, image::ImageFormat::Jpeg);
                    }
                }

                if thumb.exists() {
                    let _ = app.emit("thumbnail-ready", ThumbnailReady {
                        original: original.clone(),
                        thumb: thumb.to_string_lossy().to_string(),
                    });
                }
            });
        });

        Ok::<(), String>(())
    })
    .await
    .map_err(|e: tauri::Error| e.to_string())?
}
