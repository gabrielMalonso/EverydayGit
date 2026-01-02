mod ai;
mod commands;
mod config;
mod git;
mod setup;

use commands::AppState;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState {
            current_repo: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            commands::set_repository,
            commands::init_repository_cmd,
            commands::publish_github_repo_cmd,
            commands::get_current_repo_path,
            commands::get_git_status,
            commands::get_file_diff,
            commands::get_all_diff_cmd,
            commands::stage_file_cmd,
            commands::stage_all_cmd,
            commands::unstage_file_cmd,
            commands::commit_cmd,
            commands::amend_commit_cmd,
            commands::is_last_commit_pushed_cmd,
            commands::push_cmd,
            commands::pull_cmd,
            commands::get_branches_cmd,
            commands::checkout_branch_cmd,
            commands::checkout_remote_branch_cmd,
            commands::create_branch_cmd,
            commands::delete_branch_cmd,
            // Context Menu Commands
            commands::reset_cmd,
            commands::cherry_pick_cmd,
            commands::revert_cmd,
            commands::checkout_commit_cmd,
            commands::create_tag_cmd,
            commands::get_commit_diff_cmd,
            // Merge Commands
            commands::merge_preview_cmd,
            commands::merge_branch_cmd,
            commands::is_merge_in_progress_cmd,
            commands::get_conflict_files_cmd,
            commands::parse_conflict_file_cmd,
            commands::resolve_conflict_file_cmd,
            commands::complete_merge_cmd,
            commands::compare_branches_cmd,
            commands::get_commit_log,
            commands::get_remote_origin_url_cmd,
            commands::get_commit_shortstat_cmd,
            commands::generate_commit_msg,
            commands::ai_chat,
            commands::analyze_merge_cmd,
            commands::load_config_cmd,
            commands::save_config_cmd,
            commands::update_ai_config_cmd,
            commands::get_allowed_models_cmd,
            commands::save_api_key_cmd,
            commands::get_api_key_status_cmd,
            commands::check_all_requirements_cmd,
            commands::check_homebrew_cmd,
            commands::install_git_cmd,
            commands::install_gh_cmd,
            commands::authenticate_gh_cmd,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
