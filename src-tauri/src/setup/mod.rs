use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequirementStatus {
    pub name: String,
    pub installed: bool,
    pub version: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetupStatus {
    pub git: RequirementStatus,
    pub gh: RequirementStatus,
    pub gh_auth: RequirementStatus,
    pub all_passed: bool,
}

fn parse_git_version(output: &str) -> Option<String> {
    let line = output.lines().next()?.trim();
    line.strip_prefix("git version ").map(|v| v.trim().to_string())
}

fn parse_gh_version(output: &str) -> Option<String> {
    let line = output.lines().next()?.trim();
    if !line.starts_with("gh version ") {
        return Some(line.to_string());
    }
    line.split_whitespace().nth(2).map(|v| v.trim().to_string())
}

fn output_error_message(output: &std::process::Output) -> String {
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    if !stderr.is_empty() {
        return stderr;
    }
    String::from_utf8_lossy(&output.stdout).trim().to_string()
}

pub fn check_git_installed() -> RequirementStatus {
    let name = "Git".to_string();
    let output = Command::new("git").args(["--version"]).output();

    match output {
        Ok(output) if output.status.success() => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            RequirementStatus {
                name,
                installed: true,
                version: parse_git_version(&stdout).or_else(|| Some(stdout.trim().to_string())),
                error: None,
            }
        }
        Ok(output) => RequirementStatus {
            name,
            installed: false,
            version: None,
            error: Some(output_error_message(&output)),
        },
        Err(error) => RequirementStatus {
            name,
            installed: false,
            version: None,
            error: Some(error.to_string()),
        },
    }
}

pub fn check_gh_installed() -> RequirementStatus {
    let name = "GitHub CLI".to_string();
    let output = Command::new("gh").args(["--version"]).output();

    match output {
        Ok(output) if output.status.success() => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            RequirementStatus {
                name,
                installed: true,
                version: parse_gh_version(&stdout).or_else(|| Some(stdout.trim().to_string())),
                error: None,
            }
        }
        Ok(output) => RequirementStatus {
            name,
            installed: false,
            version: None,
            error: Some(output_error_message(&output)),
        },
        Err(error) => RequirementStatus {
            name,
            installed: false,
            version: None,
            error: Some(error.to_string()),
        },
    }
}

pub fn check_gh_authenticated() -> RequirementStatus {
    let name = "GitHub Authentication".to_string();
    let output = Command::new("gh").args(["auth", "status"]).output();

    match output {
        Ok(output) if output.status.success() => RequirementStatus {
            name,
            installed: true,
            version: None,
            error: None,
        },
        Ok(output) => RequirementStatus {
            name,
            installed: false,
            version: None,
            error: Some(output_error_message(&output)),
        },
        Err(error) => RequirementStatus {
            name,
            installed: false,
            version: None,
            error: Some(error.to_string()),
        },
    }
}

pub fn check_all_requirements() -> SetupStatus {
    let git = check_git_installed();
    let gh = check_gh_installed();
    let gh_auth = check_gh_authenticated();
    let all_passed = git.installed && gh.installed && gh_auth.installed;

    SetupStatus {
        git,
        gh,
        gh_auth,
        all_passed,
    }
}

pub fn check_homebrew_installed() -> bool {
    Command::new("brew")
        .args(["--version"])
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

pub fn install_git_via_homebrew() -> Result<String> {
    if !check_homebrew_installed() {
        return Err(anyhow!("Homebrew is not installed."));
    }

    let output = Command::new("brew")
        .args(["install", "git"])
        .output()
        .context("Failed to execute brew install git")?;

    if !output.status.success() {
        return Err(anyhow!(
            "Homebrew install failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn install_gh_via_homebrew() -> Result<String> {
    if !check_homebrew_installed() {
        return Err(anyhow!("Homebrew is not installed."));
    }

    let output = Command::new("brew")
        .args(["install", "gh"])
        .output()
        .context("Failed to execute brew install gh")?;

    if !output.status.success() {
        return Err(anyhow!(
            "Homebrew install failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn authenticate_gh_via_browser() -> Result<()> {
    Command::new("gh")
        .args(["auth", "login", "--web"])
        .spawn()
        .context("Failed to launch gh auth login --web")?;

    Ok(())
}
