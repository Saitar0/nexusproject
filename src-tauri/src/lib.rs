mod download;
mod executor;

use tauri::State;
use download::{DownloadManager, StartDownloadRequest};
use executor::{ExecuteGameRequest, GameExecutor};

// Legacy command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Download commands
#[tauri::command]
async fn start_download(
    app: tauri::AppHandle,
    manager: State<'_, DownloadManager>,
    request: StartDownloadRequest,
) -> Result<String, String> {
    manager.download_game(app, request).await
}

#[tauri::command]
async fn pause_download(
    manager: State<'_, DownloadManager>,
    download_id: String,
) -> Result<(), String> {
    manager.pause_download(&download_id)
}

#[tauri::command]
async fn resume_download(
    manager: State<'_, DownloadManager>,
    download_id: String,
) -> Result<(), String> {
    manager.resume_download(&download_id)
}

#[tauri::command]
async fn cancel_download(
    manager: State<'_, DownloadManager>,
    download_id: String,
) -> Result<(), String> {
    manager.cancel_download(&download_id)
}

// Game execution command
#[tauri::command]
async fn execute_game(app: tauri::AppHandle, request: ExecuteGameRequest) -> Result<(), String> {
    GameExecutor::execute_game(app, request).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(DownloadManager::new())
        .invoke_handler(tauri::generate_handler![
            greet,
            start_download,
            pause_download,
            resume_download,
            cancel_download,
            execute_game
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
