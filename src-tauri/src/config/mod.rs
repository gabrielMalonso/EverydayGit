use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};
use anyhow::{Result, Context, anyhow};
use crate::ai::{AiConfig, AiProvider};

const APP_CONFIG_DIR: &str = "everydaygit";
const LEGACY_APP_CONFIG_DIR: &str = "gitflow-ai";
const CONFIG_FILE: &str = "everydaygit-config.json";
const LEGACY_CONFIG_FILE: &str = "gitflow-ai-config.json";
const SECRETS_FILE: &str = "everydaygit-secrets.json";
const LEGACY_SECRETS_FILE: &str = "gitflow-ai-secrets.json";
const DEFAULT_GEMINI_MODEL: &str = "gemini-2.5-flash";
const DEFAULT_CLAUDE_MODEL: &str = "claude-haiku-4-5-20251001";
const DEFAULT_OPENAI_MODEL: &str = "gpt-5-nano-2025-08-07";

static SESSION_AI_MODEL_OVERRIDE: OnceLock<Mutex<Option<String>>> = OnceLock::new();

fn session_ai_model_override() -> &'static Mutex<Option<String>> {
    SESSION_AI_MODEL_OVERRIDE.get_or_init(|| Mutex::new(None))
}

pub(crate) fn set_session_ai_model_override(model: Option<String>) {
    if let Ok(mut guard) = session_ai_model_override().lock() {
        *guard = model;
    }
}

fn get_session_ai_model_override() -> Option<String> {
    session_ai_model_override()
        .lock()
        .ok()
        .and_then(|guard| guard.clone())
}

pub(crate) fn default_model_for_provider(provider: &AiProvider) -> Option<&'static str> {
    match provider {
        AiProvider::Gemini => Some(DEFAULT_GEMINI_MODEL),
        AiProvider::Claude => Some(DEFAULT_CLAUDE_MODEL),
        AiProvider::OpenAI => Some(DEFAULT_OPENAI_MODEL),
        AiProvider::Ollama => None,
    }
}

// ============================================================================
// Secrets Management
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecretsFile {
    pub schema_version: u32,
    pub providers: ProvidersSecrets,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProvidersSecrets {
    pub claude: Option<ProviderSecret>,
    pub openai: Option<ProviderSecret>,
    pub gemini: Option<ProviderSecret>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderSecret {
    pub api_key: String,
}

fn get_secrets_path() -> Result<PathBuf> {
    let config_dir = dirs::config_dir()
        .context("Failed to get config directory")?;
    let app_config_dir = config_dir.join(APP_CONFIG_DIR);

    if !app_config_dir.exists() {
        fs::create_dir_all(&app_config_dir)
            .context("Failed to create config directory")?;
    }

    Ok(app_config_dir.join(SECRETS_FILE))
}

fn get_legacy_secrets_path() -> Result<PathBuf> {
    let config_dir = dirs::config_dir()
        .context("Failed to get config directory")?;
    Ok(config_dir.join(LEGACY_APP_CONFIG_DIR).join(LEGACY_SECRETS_FILE))
}

fn empty_provider_secret() -> ProviderSecret {
    ProviderSecret {
        api_key: String::new(),
    }
}

impl Default for ProvidersSecrets {
    fn default() -> Self {
        Self {
            claude: Some(empty_provider_secret()),
            openai: Some(empty_provider_secret()),
            gemini: Some(empty_provider_secret()),
        }
    }
}

impl Default for SecretsFile {
    fn default() -> Self {
        Self {
            schema_version: 1,
            providers: ProvidersSecrets::default(),
        }
    }
}

fn load_secrets_optional() -> Result<Option<SecretsFile>> {
    let secrets_path = get_secrets_path()?;

    if !secrets_path.exists() {
        let legacy_secrets_path = get_legacy_secrets_path()?;
        if !legacy_secrets_path.exists() {
            return Ok(None);
        }

        let legacy_contents = fs::read_to_string(&legacy_secrets_path)
            .context("Failed to read legacy secrets file")?;

        let secrets: SecretsFile = serde_json::from_str(&legacy_contents)
            .context("Failed to parse legacy secrets file")?;

        // Best-effort migration to the new path (do not delete legacy).
        let _ = fs::write(&secrets_path, legacy_contents);

        return Ok(Some(secrets));
    }

    let contents = fs::read_to_string(&secrets_path)
        .context("Failed to read secrets file")?;

    let secrets: SecretsFile = serde_json::from_str(&contents)
        .context("Failed to parse secrets file")?;

    Ok(Some(secrets))
}

pub fn load_secrets() -> Result<SecretsFile> {
    let secrets_path = get_secrets_path()?;

    if !secrets_path.exists() {
        let legacy_secrets_path = get_legacy_secrets_path()?;
        if legacy_secrets_path.exists() {
            let legacy_contents = fs::read_to_string(&legacy_secrets_path)
                .context("Failed to read legacy secrets file")?;
            let secrets: SecretsFile = serde_json::from_str(&legacy_contents)
                .context("Failed to parse legacy secrets file")?;
            let _ = fs::write(&secrets_path, legacy_contents);
            return Ok(secrets);
        }

        return Err(anyhow!(
            "No API keys configured. Please open Settings and configure your API keys in the 'Configurar API Keys' section."
        ));
    }

    let contents = fs::read_to_string(&secrets_path)
        .context("Failed to read secrets file")?;

    let secrets: SecretsFile = serde_json::from_str(&contents)
        .context("Failed to parse secrets file")?;

    Ok(secrets)
}

pub fn get_api_key(provider: &str) -> Result<String> {
    let secrets = load_secrets()?;

    let api_key = match provider.to_lowercase().as_str() {
        "claude" => secrets.providers.claude.map(|p| p.api_key),
        "openai" => secrets.providers.openai.map(|p| p.api_key),
        "gemini" => secrets.providers.gemini.map(|p| p.api_key),
        _ => return Err(anyhow!("Unknown provider: {}", provider)),
    };

    api_key
        .filter(|k| !k.is_empty())
        .ok_or_else(|| anyhow!(
            "API key not configured for provider '{}'. \
             Please add it to your secrets file at: {}",
            provider,
            get_secrets_path().map(|p| p.display().to_string()).unwrap_or_default()
        ))
}

pub fn save_api_key(provider: &str, api_key: &str) -> Result<()> {
    let trimmed_key = api_key.trim();
    if trimmed_key.is_empty() {
        return Err(anyhow!("API key cannot be empty"));
    }

    let secrets_path = get_secrets_path()?;
    let mut secrets = load_secrets_optional()?.unwrap_or_default();
    let next_secret = ProviderSecret {
        api_key: trimmed_key.to_string(),
    };

    match provider.to_lowercase().as_str() {
        "claude" => secrets.providers.claude = Some(next_secret),
        "openai" => secrets.providers.openai = Some(next_secret),
        "gemini" => secrets.providers.gemini = Some(next_secret),
        _ => return Err(anyhow!("Unknown provider: {}", provider)),
    }

    let contents = serde_json::to_string_pretty(&secrets)
        .context("Failed to serialize secrets file")?;

    fs::write(&secrets_path, contents)
        .context("Failed to write secrets file")?;

    Ok(())
}

pub fn get_api_key_status() -> Result<HashMap<String, bool>> {
    let secrets = load_secrets_optional()?;
    let providers = secrets.map(|s| s.providers).unwrap_or_default();

    let mut status = HashMap::new();
    let is_configured = |secret: Option<ProviderSecret>| {
        secret
            .map(|p| !p.api_key.trim().is_empty())
            .unwrap_or(false)
    };

    status.insert("claude".to_string(), is_configured(providers.claude));
    status.insert("openai".to_string(), is_configured(providers.openai));
    status.insert("gemini".to_string(), is_configured(providers.gemini));

    Ok(status)
}

// ============================================================================
// App Configuration
// ============================================================================

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
                provider: AiProvider::Gemini,
                api_key: None,
                model: DEFAULT_GEMINI_MODEL.to_string(),
                base_url: None,
                save_model_as_default: false,
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

    let app_config_dir = config_dir.join(APP_CONFIG_DIR);

    if !app_config_dir.exists() {
        fs::create_dir_all(&app_config_dir)
            .context("Failed to create config directory")?;
    }

    Ok(app_config_dir.join(CONFIG_FILE))
}

fn get_legacy_config_path() -> Result<PathBuf> {
    let config_dir = dirs::config_dir()
        .context("Failed to get config directory")?;
    Ok(config_dir.join(LEGACY_APP_CONFIG_DIR).join(LEGACY_CONFIG_FILE))
}

fn load_config_raw() -> Result<AppConfig> {
    let config_path = get_config_path()?;

    if !config_path.exists() {
        let legacy_config_path = get_legacy_config_path()?;
        if !legacy_config_path.exists() {
            return Ok(AppConfig::default());
        }

        let legacy_contents = fs::read_to_string(&legacy_config_path)
            .context("Failed to read legacy config file")?;

        let legacy_config: AppConfig = serde_json::from_str(&legacy_contents)
            .context("Failed to parse legacy config file")?;

        // Best-effort migration to the new path (do not delete legacy).
        let _ = save_config(&legacy_config);

        return Ok(legacy_config);
    }

    let contents = fs::read_to_string(&config_path)
        .context("Failed to read config file")?;

    let config: AppConfig = serde_json::from_str(&contents)
        .context("Failed to parse config file")?;

    Ok(config)
}

pub fn load_config() -> Result<AppConfig> {
    let mut config = load_config_raw()?;

    if let Some(model) = get_session_ai_model_override() {
        config.ai.model = model;
    }

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

pub fn save_config_with_model_preference(mut config: AppConfig) -> Result<()> {
    if config.ai.save_model_as_default {
        set_session_ai_model_override(None);
    } else {
        set_session_ai_model_override(Some(config.ai.model.clone()));
        if let Some(default_model) = default_model_for_provider(&config.ai.provider) {
            config.ai.model = default_model.to_string();
        } else {
            config.ai.model.clear();
        }
    }

    save_config(&config)
}

pub fn update_ai_config(ai_config: AiConfig) -> Result<()> {
    let mut config = load_config_raw()?;
    config.ai = ai_config;
    save_config_with_model_preference(config)
}

#[allow(dead_code)]
pub fn update_commit_preferences(preferences: CommitPreferences) -> Result<()> {
    let mut config = load_config_raw()?;
    config.commit_preferences = preferences;
    save_config(&config)
}

pub fn update_last_repo(repo_path: String) -> Result<()> {
    let mut config = load_config_raw()?;
    config.last_repo_path = Some(repo_path);
    save_config(&config)
}
