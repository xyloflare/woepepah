// Prevents an extra console window on Windows
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_config,
            commands::save_config,
            commands::scan_directory,
            commands::apply_wallpaper,
            commands::pick_folder,
            commands::generate_thumbnails
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
