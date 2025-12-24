mod commands;
mod git;
mod ai;
mod config;

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
            commands::get_current_repo_path,
            commands::get_git_status,
            commands::get_file_diff,
            commands::get_all_diff_cmd,
            commands::stage_file_cmd,
            commands::stage_all_cmd,
            commands::unstage_file_cmd,
            commands::commit_cmd,
            commands::amend_commit_cmd,
            commands::push_cmd,
            commands::pull_cmd,
            commands::get_branches_cmd,
            commands::checkout_branch_cmd,
            commands::checkout_remote_branch_cmd,
            commands::create_branch_cmd,
            commands::delete_branch_cmd,
            commands::merge_preview_cmd,
            commands::merge_branch_cmd,
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
