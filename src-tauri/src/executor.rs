use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri::Manager;

#[derive(Serialize, Deserialize)]
pub struct ExecuteGameRequest {
    pub game_id: i32,
    pub game_title: String,
    pub executable_name: String,
}

pub struct GameExecutor;

impl GameExecutor {
    pub async fn execute_game(
        app_handle: AppHandle,
        request: ExecuteGameRequest,
    ) -> Result<(), String> {
        // Get the games directory
        let games_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data dir: {}", e))?
            .join("games");

        // Construct the game directory path
        let game_dir_name = format!(
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

        let game_dir = games_dir.join(&game_dir_name);
        let executable_path = game_dir.join(&request.executable_name);

        // Verify the executable exists and is within the game directory
        if !executable_path.exists() {
            return Err(format!("Executable not found: {:?}", executable_path));
        }

        // Security check: ensure the path is within the games directory
        let canonical_game_dir = game_dir
            .canonicalize()
            .map_err(|e| format!("Invalid game directory: {}", e))?;
        let canonical_executable = executable_path
            .canonicalize()
            .map_err(|e| format!("Invalid executable path: {}", e))?;

        if !canonical_executable.starts_with(&canonical_game_dir) {
            return Err("Executable path is outside game directory!".to_string());
        }

        // Execute the game based on platform
        #[cfg(target_os = "windows")]
        {
            std::process::Command::new(&executable_path)
                .current_dir(&game_dir)
                .spawn()
                .map_err(|e| format!("Failed to execute game: {}", e))?;
        }

        #[cfg(target_os = "macos")]
        {
            // On macOS, handle .app bundles
            if executable_path.extension().and_then(|s| s.to_str()) == Some("app") {
                std::process::Command::new("open")
                    .arg(&executable_path)
                    .spawn()
                    .map_err(|e| format!("Failed to execute game: {}", e))?;
            } else {
                std::process::Command::new(&executable_path)
                    .current_dir(&game_dir)
                    .spawn()
                    .map_err(|e| format!("Failed to execute game: {}", e))?;
            }
        }

        #[cfg(target_os = "linux")]
        {
            // On Linux, make sure executable is executable
            use std::fs;
            use std::os::unix::fs::PermissionsExt;

            let perms = fs::metadata(&executable_path)
                .map_err(|e| format!("Failed to get file metadata: {}", e))?
                .permissions();
            let mut new_perms = perms;
            new_perms.set_mode(new_perms.mode() | 0o111); // Add execute permission

            fs::set_permissions(&executable_path, new_perms)
                .map_err(|e| format!("Failed to set executable permission: {}", e))?;

            std::process::Command::new(&executable_path)
                .current_dir(&game_dir)
                .spawn()
                .map_err(|e| format!("Failed to execute game: {}", e))?;
        }

        Ok(())
    }
}
