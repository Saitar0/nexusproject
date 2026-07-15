use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::AppHandle;
use tauri::Emitter;
use tauri::Manager;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DownloadProgress {
    pub download_id: String,
    pub game_id: i32,
    pub bytes_downloaded: u64,
    pub total_bytes: u64,
    pub percent: f32,
    pub speed_mbps: f32,
    pub eta_seconds: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DownloadEvent {
    pub download_id: String,
    pub game_id: i32,
    pub status: String, // "progress", "completed", "error", "paused"
    pub message: String,
    pub progress: Option<DownloadProgress>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct StartDownloadRequest {
    pub game_id: i32,
    pub game_title: String,
    pub download_url: String,
}

pub struct DownloadManager {
    cancel_tokens: std::sync::Mutex<std::collections::HashMap<String, Arc<AtomicBool>>>,
    pause_tokens: std::sync::Mutex<std::collections::HashMap<String, Arc<AtomicBool>>>,
}

impl DownloadManager {
    pub fn new() -> Self {
        Self {
            cancel_tokens: std::sync::Mutex::new(std::collections::HashMap::new()),
            pause_tokens: std::sync::Mutex::new(std::collections::HashMap::new()),
        }
    }

    pub async fn download_game(
        &self,
        app_handle: AppHandle,
        request: StartDownloadRequest,
    ) -> Result<String, String> {
        let download_id = Uuid::new_v4().to_string();
        let download_id_clone = download_id.clone();
        let cancel_token = Arc::new(AtomicBool::new(false));
        let pause_token = Arc::new(AtomicBool::new(false));

        // Store tokens
        self.cancel_tokens
            .lock()
            .unwrap()
            .insert(download_id.clone(), cancel_token.clone());
        self.pause_tokens
            .lock()
            .unwrap()
            .insert(download_id.clone(), pause_token.clone());

        // Spawn download task
        let id = download_id.clone();
        let request_clone = request.clone();
        tokio::spawn(async move {
            let result = Self::do_download(
                app_handle.clone(),
                id.clone(),
                request.clone(),
                cancel_token,
                pause_token,
            )
            .await;

            if let Err(e) = result {
                let _ = app_handle.emit(
                    "download-error",
                    DownloadEvent {
                        download_id: id.clone(),
                        game_id: request_clone.game_id,
                        status: "error".to_string(),
                        message: e,
                        progress: None,
                    },
                );
            }
        });

        Ok(download_id_clone)
    }

    async fn do_download(
        app_handle: AppHandle,
        download_id: String,
        request: StartDownloadRequest,
        cancel_token: Arc<AtomicBool>,
        pause_token: Arc<AtomicBool>,
    ) -> Result<(), String> {
        // Get download directory
        let download_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data dir: {}", e))?
            .join("games");

        tokio::fs::create_dir_all(&download_dir)
            .await
            .map_err(|e| format!("Failed to create games directory: {}", e))?;

        let file_name = format!(
            "{}_{}",
            request.game_id,
            request
                .game_title
                .to_lowercase()
                .replace(" ", "_")
                .chars()
                .filter(|c| c.is_alphanumeric() || *c == '_')
                .collect::<String>()
        );

        let extract_dir = download_dir.join(&file_name);
        let temp_file = download_dir.join(format!("{}.zip.tmp", file_name));
        let final_file = download_dir.join(format!("{}.zip", file_name));

        // Download file with streaming
        let client = reqwest::Client::new();
        let response = client
            .get(&request.download_url)
            .send()
            .await
            .map_err(|e| format!("Failed to start download: {}", e))?;

        let total_bytes = response
            .content_length()
            .ok_or("Cannot determine file size")?;

        let mut stream = response.bytes_stream();
        let mut file = File::create(&temp_file)
            .await
            .map_err(|e| format!("Failed to create file: {}", e))?;

        let mut downloaded: u64 = 0;
        let start_time = std::time::Instant::now();
        let mut last_emit_time = std::time::Instant::now();
        let emit_interval = std::time::Duration::from_millis(500); // Emit every 500ms

        use futures::stream::StreamExt;

        while let Some(chunk) = stream.next().await {
            // Check cancellation
            if cancel_token.load(Ordering::Relaxed) {
                let _ = tokio::fs::remove_file(&temp_file).await;
                let _ = app_handle.emit(
                    "download-cancelled",
                    DownloadEvent {
                        download_id: download_id.clone(),
                        game_id: request.game_id,
                        status: "cancelled".to_string(),
                        message: "Download cancelled by user".to_string(),
                        progress: None,
                    },
                );
                return Ok(());
            }

            // Handle pause
            while pause_token.load(Ordering::Relaxed) {
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            }

            let chunk = chunk.map_err(|e| format!("Failed to read chunk: {}", e))?;
            file.write_all(&chunk)
                .await
                .map_err(|e| format!("Failed to write file: {}", e))?;

            downloaded += chunk.len() as u64;

            // Emit progress at intervals (not every byte)
            if last_emit_time.elapsed() >= emit_interval {
                let elapsed_secs = start_time.elapsed().as_secs_f64();
                let speed_mbps = (downloaded as f64 / elapsed_secs) / (1024.0 * 1024.0);
                let remaining_bytes = total_bytes - downloaded;
                let eta_seconds = if speed_mbps > 0.0 {
                    (remaining_bytes as f64 / (speed_mbps * 1024.0 * 1024.0)) as u64
                } else {
                    0
                };

                let progress = DownloadProgress {
                    download_id: download_id.clone(),
                    game_id: request.game_id,
                    bytes_downloaded: downloaded,
                    total_bytes,
                    percent: (downloaded as f32 / total_bytes as f32) * 100.0,
                    speed_mbps: speed_mbps as f32,
                    eta_seconds,
                };

                let _ = app_handle.emit(
                    "download-progress",
                    DownloadEvent {
                        download_id: download_id.clone(),
                        game_id: request.game_id,
                        status: "progress".to_string(),
                        message: format!(
                            "{:.1}% - {:.2} MB/s - ETA: {}s",
                            progress.percent, progress.speed_mbps, progress.eta_seconds
                        ),
                        progress: Some(progress),
                    },
                );

                last_emit_time = std::time::Instant::now();
            }
        }

        file.flush()
            .await
            .map_err(|e| format!("Failed to flush file: {}", e))?;
        file.sync_all()
            .await
            .map_err(|e| format!("Failed to sync file: {}", e))?;

        // Move temp file to final location
        tokio::fs::rename(&temp_file, &final_file)
            .await
            .map_err(|e| format!("Failed to finalize file: {}", e))?;

        // Extract if ZIP
        if final_file.extension().and_then(|s| s.to_str()) == Some("zip") {
            Self::extract_zip(&final_file, &extract_dir).await?;

            // Remove ZIP after extraction
            tokio::fs::remove_file(&final_file)
                .await
                .map_err(|e| format!("Failed to remove ZIP file: {}", e))?;
        }

        // Emit completion event
        let _ = app_handle.emit(
            "download-completed",
            DownloadEvent {
                download_id: download_id.clone(),
                game_id: request.game_id,
                status: "completed".to_string(),
                message: "Download and extraction completed".to_string(),
                progress: Some(DownloadProgress {
                    download_id,
                    game_id: request.game_id,
                    bytes_downloaded: total_bytes,
                    total_bytes,
                    percent: 100.0,
                    speed_mbps: 0.0,
                    eta_seconds: 0,
                }),
            },
        );

        Ok(())
    }

    async fn extract_zip(zip_path: &PathBuf, extract_dir: &PathBuf) -> Result<(), String> {
        tokio::fs::create_dir_all(extract_dir)
            .await
            .map_err(|e| format!("Failed to create extract directory: {}", e))?;

        let file = std::fs::File::open(zip_path)
            .map_err(|e| format!("Failed to open ZIP: {}", e))?;
        let mut archive = zip::ZipArchive::new(file)
            .map_err(|e| format!("Failed to read ZIP: {}", e))?;

        archive
            .extract(extract_dir)
            .map_err(|e| format!("Failed to extract ZIP: {}", e))?;

        Ok(())
    }

    pub fn pause_download(&self, download_id: &str) -> Result<(), String> {
        self.pause_tokens
            .lock()
            .unwrap()
            .get(download_id)
            .ok_or("Download not found")?
            .store(true, Ordering::Relaxed);
        Ok(())
    }

    pub fn resume_download(&self, download_id: &str) -> Result<(), String> {
        self.pause_tokens
            .lock()
            .unwrap()
            .get(download_id)
            .ok_or("Download not found")?
            .store(false, Ordering::Relaxed);
        Ok(())
    }

    pub fn cancel_download(&self, download_id: &str) -> Result<(), String> {
        self.cancel_tokens
            .lock()
            .unwrap()
            .get(download_id)
            .ok_or("Download not found")?
            .store(true, Ordering::Relaxed);
        Ok(())
    }
}
