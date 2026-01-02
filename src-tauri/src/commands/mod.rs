use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

use crate::ai;
use crate::config;
use crate::git;
use crate::setup;

pub struct AppState {
    pub current_repo: Mutex<Option<PathBuf>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepoSelectionResult {
    pub is_git: bool,
    pub path: String,
}

#[tauri::command]
pub fn set_repository(path: String, state: State<AppState>) -> Result<RepoSelectionResult, String> {
    let repo_path = PathBuf::from(&path);

    if !repo_path.exists() {
        return Err("Repository path does not exist".to_string());
    }
    if !repo_path.is_dir() {
        return Err("Repository path is not a directory".to_string());
    }

    let is_git = git::is_git_repo(&repo_path);

    if is_git {
        *state.current_repo.lock().unwrap() = Some(repo_path);
    } else {
        *state.current_repo.lock().unwrap() = None;
    }

    // Save last repo path
    config::update_last_repo(path.clone()).map_err(|e| e.to_string())?;

    Ok(RepoSelectionResult { is_git, path })
}

#[tauri::command]
pub fn init_repository_cmd(
    options: git::InitRepoOptions,
    state: State<AppState>,
) -> Result<git::InitRepoResult, String> {
    let result = git::init_repository(&options).map_err(|e| e.to_string())?;
    let repo_path = PathBuf::from(&options.path);
    *state.current_repo.lock().unwrap() = Some(repo_path);
    config::update_last_repo(options.path).map_err(|e| e.to_string())?;
    Ok(result)
}

#[tauri::command]
pub fn publish_github_repo_cmd(
    options: git::PublishRepoOptions,
) -> Result<git::PublishRepoResult, String> {
    git::publish_github_repo(&options).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_git_status(state: State<AppState>) -> Result<git::RepoStatus, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::get_status(repo_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_file_diff(
    file_path: String,
    staged: bool,
    state: State<AppState>,
) -> Result<String, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::get_diff(repo_path, &file_path, staged).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_all_diff_cmd(staged: bool, state: State<AppState>) -> Result<String, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::get_all_diff(repo_path, staged).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn stage_file_cmd(file_path: String, state: State<AppState>) -> Result<(), String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::stage_file(repo_path, &file_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn stage_all_cmd(state: State<AppState>) -> Result<(), String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::stage_all(repo_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn unstage_file_cmd(file_path: String, state: State<AppState>) -> Result<(), String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::unstage_file(repo_path, &file_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn commit_cmd(message: String, state: State<AppState>) -> Result<(), String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::commit(repo_path, &message).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn amend_commit_cmd(message: String, state: State<AppState>) -> Result<(), String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::amend_commit(repo_path, &message).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn is_last_commit_pushed_cmd(state: State<AppState>) -> Result<bool, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::is_last_commit_pushed(repo_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn push_cmd(state: State<AppState>) -> Result<String, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::push(repo_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn pull_cmd(state: State<AppState>) -> Result<String, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::pull(repo_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_branches_cmd(state: State<AppState>) -> Result<Vec<git::Branch>, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::get_branches(repo_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn checkout_branch_cmd(branch_name: String, state: State<AppState>) -> Result<(), String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::checkout_branch(repo_path, &branch_name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn checkout_remote_branch_cmd(
    remote_ref: String,
    state: State<AppState>,
) -> Result<(), String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::checkout_remote_branch(repo_path, &remote_ref).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_branch_cmd(
    name: String,
    from: Option<String>,
    push_to_remote: bool,
    checkout: Option<bool>,
    state: State<AppState>,
) -> Result<(), String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    let should_checkout = checkout.unwrap_or(true); // Default: checkout for backward compatibility
    git::create_branch(
        repo_path,
        &name,
        from.as_deref(),
        push_to_remote,
        should_checkout,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_branch_cmd(
    name: String,
    force: bool,
    is_remote: bool,
    state: State<AppState>,
) -> Result<(), String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::delete_branch(repo_path, &name, force, is_remote).map_err(|e| e.to_string())
}

// ============================================================================
// New Context Menu Commands
// ============================================================================

#[tauri::command]
pub fn reset_cmd(hash: String, mode: String, state: State<AppState>) -> Result<(), String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::reset(repo_path, &hash, &mode).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cherry_pick_cmd(hash: String, state: State<AppState>) -> Result<String, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::cherry_pick(repo_path, &hash).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn revert_cmd(hash: String, state: State<AppState>) -> Result<String, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::revert(repo_path, &hash).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn checkout_commit_cmd(hash: String, state: State<AppState>) -> Result<(), String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::checkout_commit(repo_path, &hash).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_tag_cmd(
    name: String,
    hash: String,
    message: Option<String>,
    state: State<AppState>,
) -> Result<(), String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::create_tag(repo_path, &name, &hash, message.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_commit_diff_cmd(hash: String, state: State<AppState>) -> Result<String, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::get_commit_diff(repo_path, &hash).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn merge_preview_cmd(
    source: String,
    target: Option<String>,
    state: State<AppState>,
) -> Result<git::MergePreview, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::merge_preview(repo_path, &source, target.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn merge_branch_cmd(
    source: String,
    message: Option<String>,
    state: State<AppState>,
) -> Result<git::MergeResult, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::merge_branch(repo_path, &source, message.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn is_merge_in_progress_cmd(state: State<AppState>) -> Result<(bool, Vec<String>), String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::check_merge_in_progress(repo_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_conflict_files_cmd(state: State<AppState>) -> Result<Vec<String>, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::get_conflict_files(repo_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn parse_conflict_file_cmd(
    file_path: String,
    state: State<AppState>,
) -> Result<git::ConflictFile, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::parse_conflict_file(repo_path, &file_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn resolve_conflict_file_cmd(
    file_path: String,
    resolved_content: String,
    state: State<AppState>,
) -> Result<(), String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::resolve_conflict_file(repo_path, &file_path, &resolved_content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn complete_merge_cmd(
    message: Option<String>,
    state: State<AppState>,
) -> Result<String, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::complete_merge(repo_path, message.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn compare_branches_cmd(
    base: String,
    compare: String,
    state: State<AppState>,
) -> Result<git::BranchComparison, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::compare_branches(repo_path, &base, &compare).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_commit_log(
    limit: usize,
    state: State<AppState>,
) -> Result<Vec<git::CommitInfo>, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::get_log(repo_path, limit).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_remote_origin_url_cmd(state: State<AppState>) -> Result<Option<String>, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::get_remote_origin_url(repo_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_commit_shortstat_cmd(
    hash: String,
    state: State<AppState>,
) -> Result<git::CommitShortStat, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::get_commit_shortstat(repo_path, &hash).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_commit_msg(diff: String) -> Result<String, String> {
    let config = config::load_config().map_err(|e| e.to_string())?;

    let preferences = ai::CommitPreferences {
        language: config.commit_preferences.language,
        style: config.commit_preferences.style,
        max_length: config.commit_preferences.max_length,
    };

    ai::generate_commit_message(&config.ai, &diff, &preferences)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn ai_chat(messages: Vec<ai::ChatMessage>) -> Result<String, String> {
    let config = config::load_config().map_err(|e| e.to_string())?;

    ai::chat_with_ai(&config.ai, &messages)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn analyze_merge_cmd(
    source_branch: String,
    target_branch: String,
    conflicts: Vec<String>,
    files_changed: usize,
    insertions: usize,
    deletions: usize,
) -> Result<String, String> {
    let config = config::load_config().map_err(|e| e.to_string())?;

    ai::analyze_merge_conflicts(
        &config.ai,
        &source_branch,
        &target_branch,
        &conflicts,
        files_changed,
        insertions,
        deletions,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_config_cmd() -> Result<config::AppConfig, String> {
    config::load_config().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_config_cmd(config_data: config::AppConfig) -> Result<(), String> {
    config::save_config_with_model_preference(config_data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_ai_config_cmd(ai_config: ai::AiConfig) -> Result<(), String> {
    config::update_ai_config(ai_config).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_current_repo_path(state: State<AppState>) -> Result<String, String> {
    let repo = state.current_repo.lock().unwrap();
    repo.as_ref()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or("No repository selected".to_string())
}

#[tauri::command]
pub fn get_allowed_models_cmd(provider: String) -> Vec<String> {
    ai::get_allowed_models(&provider)
}

#[tauri::command]
pub fn save_api_key_cmd(provider: String, api_key: String) -> Result<(), String> {
    config::save_api_key(&provider, &api_key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_api_key_status_cmd() -> Result<HashMap<String, bool>, String> {
    config::get_api_key_status().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn check_all_requirements_cmd() -> setup::SetupStatus {
    setup::check_all_requirements()
}

#[tauri::command]
pub fn check_homebrew_cmd() -> bool {
    setup::check_homebrew_installed()
}

#[tauri::command]
pub fn install_git_cmd() -> Result<String, String> {
    setup::install_git_via_homebrew().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn install_gh_cmd() -> Result<String, String> {
    setup::install_gh_via_homebrew().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn authenticate_gh_cmd() -> Result<setup::AuthResult, String> {
    setup::authenticate_gh_via_browser().map_err(|e| e.to_string())
}

// ============================================================================
// Worktree Commands
// ============================================================================

#[tauri::command]
pub fn get_worktrees_cmd(state: State<AppState>) -> Result<Vec<git::Worktree>, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::get_worktrees(repo_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_worktree_cmd(
    worktree_path: String,
    force: bool,
    state: State<AppState>,
) -> Result<(), String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::remove_worktree(repo_path, &worktree_path, force).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn open_in_finder_cmd(path: String) -> Result<(), String> {
    git::open_path_in_finder(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn open_worktree_window_cmd(
    worktree_path: String,
    worktree_branch: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    use tauri::Manager;
    use tauri::WebviewUrl;
    use tauri::WebviewWindowBuilder;

    // Create a unique window label based on the path
    let label = format!(
        "worktree-{}",
        worktree_path
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '-')
            .collect::<String>()
            .chars()
            .take(20)
            .collect::<String>()
    );

    // Check if window already exists - focus it
    if let Some(window) = app_handle.get_webview_window(&label) {
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Encode path for URL (simple percent-encoding for spaces and special chars)
    let encoded_path = worktree_path
        .replace('%', "%25")
        .replace(' ', "%20")
        .replace('/', "%2F");

    // Create URL with repo query param
    let url = format!("index.html?repo={}", encoded_path);

    WebviewWindowBuilder::new(&app_handle, &label, WebviewUrl::App(url.into()))
        .title(format!("EverydayGit - {}", worktree_branch))
        .inner_size(1200.0, 800.0)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}
