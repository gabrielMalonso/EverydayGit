use std::collections::HashMap;
use std::path::PathBuf;
use tauri::State;
use std::sync::Mutex;

use crate::git;
use crate::ai;
use crate::config;
use crate::setup;

pub struct AppState {
    pub current_repo: Mutex<Option<PathBuf>>,
}

#[tauri::command]
pub fn set_repository(path: String, state: State<AppState>) -> Result<(), String> {
    let repo_path = PathBuf::from(&path);

    if !repo_path.exists() {
        return Err("Repository path does not exist".to_string());
    }

    // Check if it's a git repository
    let git_dir = repo_path.join(".git");
    if !git_dir.exists() {
        return Err("Not a git repository".to_string());
    }

    *state.current_repo.lock().unwrap() = Some(repo_path);

    // Save last repo path
    config::update_last_repo(path).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_git_status(state: State<AppState>) -> Result<git::RepoStatus, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::get_status(repo_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_file_diff(file_path: String, staged: bool, state: State<AppState>) -> Result<String, String> {
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
pub fn checkout_remote_branch_cmd(remote_ref: String, state: State<AppState>) -> Result<(), String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::checkout_remote_branch(repo_path, &remote_ref).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_branch_cmd(name: String, from: Option<String>, push_to_remote: bool, state: State<AppState>) -> Result<(), String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::create_branch(repo_path, &name, from.as_deref(), push_to_remote).map_err(|e| e.to_string())
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

#[tauri::command]
pub fn merge_preview_cmd(source: String, target: Option<String>, state: State<AppState>) -> Result<git::MergePreview, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::merge_preview(repo_path, &source, target.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn merge_branch_cmd(source: String, message: Option<String>, state: State<AppState>) -> Result<git::MergeResult, String> {
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
pub fn parse_conflict_file_cmd(file_path: String, state: State<AppState>) -> Result<git::ConflictFile, String> {
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
pub fn complete_merge_cmd(message: Option<String>, state: State<AppState>) -> Result<String, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::complete_merge(repo_path, message.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn compare_branches_cmd(base: String, compare: String, state: State<AppState>) -> Result<git::BranchComparison, String> {
    let repo = state.current_repo.lock().unwrap();
    let repo_path = repo.as_ref().ok_or("No repository selected")?;

    git::compare_branches(repo_path, &base, &compare).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_commit_log(limit: usize, state: State<AppState>) -> Result<Vec<git::CommitInfo>, String> {
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
pub fn get_commit_shortstat_cmd(hash: String, state: State<AppState>) -> Result<git::CommitShortStat, String> {
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
