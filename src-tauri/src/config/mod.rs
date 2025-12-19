use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::fs;
use anyhow::{Result, Context};
use crate::ai::{AiConfig, AiProvider};

const CONFIG_FILE: &str = "gitflow-ai-config.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub schema_version: u32,
    pub ai: AiConfig,
    pub commit_preferences: CommitPreferences,
    pub last_repo_path: Option<String>,
    pub theme: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitPreferences {
    pub language: String,
    pub style: String,
    pub max_length: usize,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            schema_version: 1,
            ai: AiConfig {
                provider: AiProvider::Claude,
                api_key: None,
                model: "claude-3-5-sonnet-20241022".to_string(),
                base_url: None,
            },
            commit_preferences: CommitPreferences {
                language: "English".to_string(),
                style: "conventional".to_string(),
                max_length: 72,
            },
            last_repo_path: None,
            theme: "dark".to_string(),
        }
    }
}

pub fn get_config_path() -> Result<PathBuf> {
    let config_dir = dirs::config_dir()
        .context("Failed to get config directory")?;

    let app_config_dir = config_dir.join("gitflow-ai");

    if !app_config_dir.exists() {
        fs::create_dir_all(&app_config_dir)
            .context("Failed to create config directory")?;
    }

    Ok(app_config_dir.join(CONFIG_FILE))
}

pub fn load_config() -> Result<AppConfig> {
    let config_path = get_config_path()?;

    if !config_path.exists() {
        return Ok(AppConfig::default());
    }

    let contents = fs::read_to_string(&config_path)
        .context("Failed to read config file")?;

    let config: AppConfig = serde_json::from_str(&contents)
        .context("Failed to parse config file")?;

    Ok(config)
}

pub fn save_config(config: &AppConfig) -> Result<()> {
    let config_path = get_config_path()?;

    let contents = serde_json::to_string_pretty(config)
        .context("Failed to serialize config")?;

    fs::write(&config_path, contents)
        .context("Failed to write config file")?;

    Ok(())
}

pub fn update_ai_config(ai_config: AiConfig) -> Result<()> {
    let mut config = load_config()?;
    config.ai = ai_config;
    save_config(&config)
}

pub fn update_commit_preferences(preferences: CommitPreferences) -> Result<()> {
    let mut config = load_config()?;
    config.commit_preferences = preferences;
    save_config(&config)
}

pub fn update_last_repo(repo_path: String) -> Result<()> {
    let mut config = load_config()?;
    config.last_repo_path = Some(repo_path);
    save_config(&config)
}
