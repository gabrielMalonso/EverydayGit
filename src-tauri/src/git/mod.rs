use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;
use anyhow::{Result, Context};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileStatus {
    pub path: String,
    pub status: String,
    pub staged: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Branch {
    pub name: String,
    pub current: bool,
    pub remote: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitInfo {
    pub hash: String,
    pub message: String,
    pub author: String,
    pub date: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepoStatus {
    pub files: Vec<FileStatus>,
    pub current_branch: String,
    pub ahead: u32,
    pub behind: u32,
}

pub fn get_status(repo_path: &PathBuf) -> Result<RepoStatus> {
    let output = Command::new("git")
        .args(&["status", "--porcelain=v1", "--branch"])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git status")?;

    if !output.status.success() {
        anyhow::bail!("Git command failed: {}", String::from_utf8_lossy(&output.stderr));
    }

    let status_output = String::from_utf8_lossy(&output.stdout);
    let mut files = Vec::new();
    let mut current_branch = String::from("unknown");
    let mut ahead = 0;
    let mut behind = 0;

    for line in status_output.lines() {
        if line.starts_with("##") {
            // Parse branch info
            let branch_info = line.trim_start_matches("## ");
            if let Some(branch_name) = branch_info.split("...").next() {
                current_branch = branch_name.to_string();
            }

            // Parse ahead/behind
            if branch_info.contains("[ahead") {
                if let Some(ahead_str) = branch_info.split("[ahead ").nth(1) {
                    if let Some(num) = ahead_str.split("]").next() {
                        ahead = num.trim_end_matches(']').parse().unwrap_or(0);
                    }
                }
            }
            if branch_info.contains("behind") {
                if let Some(behind_str) = branch_info.split("behind ").nth(1) {
                    if let Some(num) = behind_str.split("]").next() {
                        behind = num.trim_end_matches(']').parse().unwrap_or(0);
                    }
                }
            }
        } else if line.len() >= 3 {
            let status_code = &line[0..2];
            let file_path = line[3..].to_string();

            let (status, staged) = match status_code {
                "M " => ("Modified", true),
                " M" => ("Modified", false),
                "MM" => ("Modified", true),
                "A " => ("Added", true),
                " A" => ("Added", false),
                "D " => ("Deleted", true),
                " D" => ("Deleted", false),
                "??" => ("Untracked", false),
                "R " => ("Renamed", true),
                "C " => ("Copied", true),
                _ => ("Unknown", false),
            };

            files.push(FileStatus {
                path: file_path,
                status: status.to_string(),
                staged,
            });
        }
    }

    Ok(RepoStatus {
        files,
        current_branch,
        ahead,
        behind,
    })
}

pub fn get_diff(repo_path: &PathBuf, file_path: &str, staged: bool) -> Result<String> {
    let mut args = vec!["diff"];
    if staged {
        args.push("--cached");
    }
    args.push("--");
    args.push(file_path);

    let output = Command::new("git")
        .args(&args)
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git diff")?;

    if !output.status.success() {
        anyhow::bail!("Git diff failed: {}", String::from_utf8_lossy(&output.stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn get_all_diff(repo_path: &PathBuf, staged: bool) -> Result<String> {
    let mut args = vec!["diff"];
    if staged {
        args.push("--cached");
    }

    let output = Command::new("git")
        .args(&args)
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git diff")?;

    if !output.status.success() {
        anyhow::bail!("Git diff failed: {}", String::from_utf8_lossy(&output.stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn stage_file(repo_path: &PathBuf, file_path: &str) -> Result<()> {
    let output = Command::new("git")
        .args(&["add", file_path])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git add")?;

    if !output.status.success() {
        anyhow::bail!("Git add failed: {}", String::from_utf8_lossy(&output.stderr));
    }

    Ok(())
}

pub fn unstage_file(repo_path: &PathBuf, file_path: &str) -> Result<()> {
    let output = Command::new("git")
        .args(&["reset", "HEAD", file_path])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git reset")?;

    if !output.status.success() {
        anyhow::bail!("Git reset failed: {}", String::from_utf8_lossy(&output.stderr));
    }

    Ok(())
}

pub fn commit(repo_path: &PathBuf, message: &str) -> Result<()> {
    let output = Command::new("git")
        .args(&["commit", "-m", message])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git commit")?;

    if !output.status.success() {
        anyhow::bail!("Git commit failed: {}", String::from_utf8_lossy(&output.stderr));
    }

    Ok(())
}

pub fn push(repo_path: &PathBuf) -> Result<String> {
    let output = Command::new("git")
        .args(&["push"])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git push")?;

    if !output.status.success() {
        anyhow::bail!("Git push failed: {}", String::from_utf8_lossy(&output.stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn pull(repo_path: &PathBuf) -> Result<String> {
    let output = Command::new("git")
        .args(&["pull"])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git pull")?;

    if !output.status.success() {
        anyhow::bail!("Git pull failed: {}", String::from_utf8_lossy(&output.stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn get_branches(repo_path: &PathBuf) -> Result<Vec<Branch>> {
    // Get local branches
    let output = Command::new("git")
        .args(&["branch", "--list"])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git branch")?;

    if !output.status.success() {
        anyhow::bail!("Git branch failed: {}", String::from_utf8_lossy(&output.stderr));
    }

    let mut branches = Vec::new();
    let branch_output = String::from_utf8_lossy(&output.stdout);

    for line in branch_output.lines() {
        let is_current = line.starts_with("*");
        let name = line.trim_start_matches("* ").trim().to_string();

        branches.push(Branch {
            name,
            current: is_current,
            remote: false,
        });
    }

    // Get remote branches
    let output = Command::new("git")
        .args(&["branch", "-r"])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git branch -r")?;

    if output.status.success() {
        let remote_output = String::from_utf8_lossy(&output.stdout);
        for line in remote_output.lines() {
            let name = line.trim().to_string();
            if !name.contains("HEAD") {
                branches.push(Branch {
                    name,
                    current: false,
                    remote: true,
                });
            }
        }
    }

    Ok(branches)
}

pub fn checkout_branch(repo_path: &PathBuf, branch_name: &str) -> Result<()> {
    let output = Command::new("git")
        .args(&["checkout", branch_name])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git checkout")?;

    if !output.status.success() {
        anyhow::bail!("Git checkout failed: {}", String::from_utf8_lossy(&output.stderr));
    }

    Ok(())
}

pub fn get_log(repo_path: &PathBuf, limit: usize) -> Result<Vec<CommitInfo>> {
    let output = Command::new("git")
        .args(&[
            "log",
            &format!("-{}", limit),
            "--pretty=format:%H%x00%s%x00%an%x00%ai",
        ])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git log")?;

    if !output.status.success() {
        anyhow::bail!("Git log failed: {}", String::from_utf8_lossy(&output.stderr));
    }

    let log_output = String::from_utf8_lossy(&output.stdout);
    let mut commits = Vec::new();

    for line in log_output.lines() {
        let parts: Vec<&str> = line.split('\0').collect();
        if parts.len() >= 4 {
            commits.push(CommitInfo {
                hash: parts[0].to_string(),
                message: parts[1].to_string(),
                author: parts[2].to_string(),
                date: parts[3].to_string(),
            });
        }
    }

    Ok(commits)
}
