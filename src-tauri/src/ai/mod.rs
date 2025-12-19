use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};
use reqwest::Client;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AiProvider {
    Claude,
    OpenAI,
    Ollama,
    Gemini,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiConfig {
    pub provider: AiProvider,
    pub api_key: Option<String>,
    pub model: String,
    pub base_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ClaudeRequest {
    model: String,
    max_tokens: u32,
    messages: Vec<ClaudeMessage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ClaudeMessage {
    role: String,
    content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ClaudeResponse {
    content: Vec<ClaudeContent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ClaudeContent {
    text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<OpenAIMessage>,
    max_tokens: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OpenAIMessage {
    role: String,
    content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OpenAIChoice {
    message: OpenAIMessage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OllamaResponse {
    response: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct GeminiRequest {
    contents: Vec<GeminiContent>,
    #[serde(rename = "generationConfig")]
    generation_config: GeminiGenerationConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct GeminiContent {
    parts: Vec<GeminiPart>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct GeminiPart {
    text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct GeminiGenerationConfig {
    #[serde(rename = "maxOutputTokens")]
    max_output_tokens: u32,
    temperature: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct GeminiResponse {
    candidates: Vec<GeminiCandidate>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct GeminiCandidate {
    content: GeminiContent,
}

pub async fn generate_commit_message(
    config: &AiConfig,
    diff: &str,
    preferences: &CommitPreferences,
) -> Result<String> {
    let prompt = build_commit_prompt(diff, preferences);

    match config.provider {
        AiProvider::Claude => generate_with_claude(config, &prompt).await,
        AiProvider::OpenAI => generate_with_openai(config, &prompt).await,
        AiProvider::Ollama => generate_with_ollama(config, &prompt).await,
        AiProvider::Gemini => generate_with_gemini(config, &prompt).await,
    }
}

pub async fn chat_with_ai(
    config: &AiConfig,
    messages: &[ChatMessage],
) -> Result<String> {
    match config.provider {
        AiProvider::Claude => chat_with_claude(config, messages).await,
        AiProvider::OpenAI => chat_with_openai(config, messages).await,
        AiProvider::Ollama => chat_with_ollama(config, messages).await,
        AiProvider::Gemini => chat_with_gemini(config, messages).await,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitPreferences {
    pub language: String,
    pub style: String,
    pub max_length: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

fn build_commit_prompt(diff: &str, prefs: &CommitPreferences) -> String {
    format!(
        r#"You are a helpful assistant that generates clear, concise git commit messages.

Language: {}
Style: {}
Max length: {} characters

Based on the following git diff, generate a commit message that:
1. Clearly describes what changed
2. Follows the {} style
3. Is written in {}
4. Does not exceed {} characters

Git diff:
```
{}
```

Generate only the commit message, without any additional explanation or formatting."#,
        prefs.language,
        prefs.style,
        prefs.max_length,
        prefs.style,
        prefs.language,
        prefs.max_length,
        diff
    )
}

async fn generate_with_claude(config: &AiConfig, prompt: &str) -> Result<String> {
    let api_key = config.api_key.as_ref()
        .context("Claude API key not configured")?;

    let client = Client::new();
    let request = ClaudeRequest {
        model: config.model.clone(),
        max_tokens: 1024,
        messages: vec![ClaudeMessage {
            role: "user".to_string(),
            content: prompt.to_string(),
        }],
    };

    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&request)
        .send()
        .await
        .context("Failed to send request to Claude API")?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        anyhow::bail!("Claude API error: {}", error_text);
    }

    let claude_response: ClaudeResponse = response.json().await
        .context("Failed to parse Claude response")?;

    Ok(claude_response.content.first()
        .map(|c| c.text.clone())
        .unwrap_or_default())
}

async fn generate_with_openai(config: &AiConfig, prompt: &str) -> Result<String> {
    let api_key = config.api_key.as_ref()
        .context("OpenAI API key not configured")?;

    let client = Client::new();
    let request = OpenAIRequest {
        model: config.model.clone(),
        max_tokens: 1024,
        messages: vec![OpenAIMessage {
            role: "user".to_string(),
            content: prompt.to_string(),
        }],
    };

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("content-type", "application/json")
        .json(&request)
        .send()
        .await
        .context("Failed to send request to OpenAI API")?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        anyhow::bail!("OpenAI API error: {}", error_text);
    }

    let openai_response: OpenAIResponse = response.json().await
        .context("Failed to parse OpenAI response")?;

    Ok(openai_response.choices.first()
        .map(|c| c.message.content.clone())
        .unwrap_or_default())
}

async fn generate_with_ollama(config: &AiConfig, prompt: &str) -> Result<String> {
    let base_url = config.base_url.as_ref()
        .map(|s| s.as_str())
        .unwrap_or("http://localhost:11434");

    let client = Client::new();
    let request = OllamaRequest {
        model: config.model.clone(),
        prompt: prompt.to_string(),
        stream: false,
    };

    let response = client
        .post(format!("{}/api/generate", base_url))
        .json(&request)
        .send()
        .await
        .context("Failed to send request to Ollama")?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        anyhow::bail!("Ollama error: {}", error_text);
    }

    let ollama_response: OllamaResponse = response.json().await
        .context("Failed to parse Ollama response")?;

    Ok(ollama_response.response)
}

async fn generate_with_gemini(config: &AiConfig, prompt: &str) -> Result<String> {
    let api_key = config.api_key.as_ref()
        .context("Gemini API key not configured")?;

    let client = Client::new();
    let request = GeminiRequest {
        contents: vec![GeminiContent {
            parts: vec![GeminiPart {
                text: prompt.to_string(),
            }],
        }],
        generation_config: GeminiGenerationConfig {
            max_output_tokens: 1024,
            temperature: 0.7,
        },
    };

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        config.model, api_key
    );

    let response = client
        .post(&url)
        .header("content-type", "application/json")
        .json(&request)
        .send()
        .await
        .context("Failed to send request to Gemini API")?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        anyhow::bail!("Gemini API error: {}", error_text);
    }

    let gemini_response: GeminiResponse = response.json().await
        .context("Failed to parse Gemini response")?;

    Ok(gemini_response.candidates.first()
        .and_then(|c| c.content.parts.first())
        .map(|p| p.text.clone())
        .unwrap_or_default())
}

async fn chat_with_gemini(config: &AiConfig, messages: &[ChatMessage]) -> Result<String> {
    let api_key = config.api_key.as_ref()
        .context("Gemini API key not configured")?;

    // Gemini doesn't support role-based messages in the same way, so we'll concatenate
    let combined_prompt = messages
        .iter()
        .map(|m| format!("{}: {}", m.role, m.content))
        .collect::<Vec<_>>()
        .join("\n\n");

    let client = Client::new();
    let request = GeminiRequest {
        contents: vec![GeminiContent {
            parts: vec![GeminiPart {
                text: combined_prompt,
            }],
        }],
        generation_config: GeminiGenerationConfig {
            max_output_tokens: 4096,
            temperature: 0.7,
        },
    };

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        config.model, api_key
    );

    let response = client
        .post(&url)
        .header("content-type", "application/json")
        .json(&request)
        .send()
        .await
        .context("Failed to send request to Gemini API")?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        anyhow::bail!("Gemini API error: {}", error_text);
    }

    let gemini_response: GeminiResponse = response.json().await
        .context("Failed to parse Gemini response")?;

    Ok(gemini_response.candidates.first()
        .and_then(|c| c.content.parts.first())
        .map(|p| p.text.clone())
        .unwrap_or_default())
}

async fn chat_with_claude(config: &AiConfig, messages: &[ChatMessage]) -> Result<String> {
    let api_key = config.api_key.as_ref()
        .context("Claude API key not configured")?;

    let client = Client::new();
    let claude_messages: Vec<ClaudeMessage> = messages
        .iter()
        .map(|m| ClaudeMessage {
            role: m.role.clone(),
            content: m.content.clone(),
        })
        .collect();

    let request = ClaudeRequest {
        model: config.model.clone(),
        max_tokens: 4096,
        messages: claude_messages,
    };

    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&request)
        .send()
        .await
        .context("Failed to send request to Claude API")?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        anyhow::bail!("Claude API error: {}", error_text);
    }

    let claude_response: ClaudeResponse = response.json().await
        .context("Failed to parse Claude response")?;

    Ok(claude_response.content.first()
        .map(|c| c.text.clone())
        .unwrap_or_default())
}

async fn chat_with_openai(config: &AiConfig, messages: &[ChatMessage]) -> Result<String> {
    let api_key = config.api_key.as_ref()
        .context("OpenAI API key not configured")?;

    let client = Client::new();
    let openai_messages: Vec<OpenAIMessage> = messages
        .iter()
        .map(|m| OpenAIMessage {
            role: m.role.clone(),
            content: m.content.clone(),
        })
        .collect();

    let request = OpenAIRequest {
        model: config.model.clone(),
        max_tokens: 4096,
        messages: openai_messages,
    };

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("content-type", "application/json")
        .json(&request)
        .send()
        .await
        .context("Failed to send request to OpenAI API")?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        anyhow::bail!("OpenAI API error: {}", error_text);
    }

    let openai_response: OpenAIResponse = response.json().await
        .context("Failed to parse OpenAI response")?;

    Ok(openai_response.choices.first()
        .map(|c| c.message.content.clone())
        .unwrap_or_default())
}

async fn chat_with_ollama(config: &AiConfig, messages: &[ChatMessage]) -> Result<String> {
    let base_url = config.base_url.as_ref()
        .map(|s| s.as_str())
        .unwrap_or("http://localhost:11434");

    // For chat, we'll concatenate messages into a single prompt
    let prompt = messages
        .iter()
        .map(|m| format!("{}: {}", m.role, m.content))
        .collect::<Vec<_>>()
        .join("\n\n");

    let client = Client::new();
    let request = OllamaRequest {
        model: config.model.clone(),
        prompt,
        stream: false,
    };

    let response = client
        .post(format!("{}/api/generate", base_url))
        .json(&request)
        .send()
        .await
        .context("Failed to send request to Ollama")?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        anyhow::bail!("Ollama error: {}", error_text);
    }

    let ollama_response: OllamaResponse = response.json().await
        .context("Failed to parse Ollama response")?;

    Ok(ollama_response.response)
}

