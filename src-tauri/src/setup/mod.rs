use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use std::process::{Command, Stdio};
use std::sync::OnceLock;

/// Writes debug info to ~/Library/Logs/EverydayGit/debug.log
/// so we can diagnose issues in the production .app bundle.
pub fn debug_log(msg: &str) {
    use std::io::Write;
    let log_dir = dirs::home_dir()
        .unwrap_or_default()
        .join("Library/Logs/EverydayGit");
    let _ = std::fs::create_dir_all(&log_dir);
    let log_path = log_dir.join("debug.log");
    if let Ok(mut f) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
    {
        let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
        let _ = writeln!(f, "[{}] {}", now, msg);
    }
}

/// Cached full PATH resolved from the user's login shell.
/// macOS GUI apps (.app bundles) inherit a minimal PATH from launchd
/// (/usr/bin:/bin:/usr/sbin:/sbin) that doesn't include Homebrew, nvm,
/// fnm, volta, or other user-installed tool directories.
/// We resolve the real PATH once by running a login shell.
static SHELL_PATH: OnceLock<String> = OnceLock::new();

/// Resolves the full PATH from the user's login shell.
/// Falls back to extending the current PATH with common locations.
pub fn get_shell_path() -> &'static str {
    SHELL_PATH.get_or_init(|| {
        let process_path = std::env::var("PATH").unwrap_or_default();
        debug_log(&format!("get_shell_path: process PATH = {}", process_path));

        // Try to get PATH from a login shell (covers nvm, fnm, volta, Homebrew, etc.)
        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
        debug_log(&format!("get_shell_path: SHELL = {}", shell));

        match Command::new(&shell)
            .args(["-l", "-c", "echo $PATH"])
            .stdin(Stdio::null())
            .stderr(Stdio::piped())
            .output()
        {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
                let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
                debug_log(&format!(
                    "get_shell_path: shell exit={}, stdout_len={}, stderr={}",
                    output.status, stdout.len(), stderr
                ));
                if output.status.success() && !stdout.is_empty() {
                    debug_log(&format!("get_shell_path: resolved = {}", stdout));
                    return stdout;
                }
            }
            Err(e) => {
                debug_log(&format!("get_shell_path: shell failed: {}", e));
            }
        }

        // Fallback: extend current PATH with common locations
        debug_log("get_shell_path: using fallback PATH");
        let current = std::env::var("PATH").unwrap_or_default();
        let extra = [
            "/opt/homebrew/bin",
            "/opt/homebrew/sbin",
            "/usr/local/bin",
            "/usr/local/sbin",
        ];
        let mut extended = current.clone();
        for p in extra {
            if !current.contains(p) {
                extended = format!("{}:{}", p, extended);
            }
        }
        debug_log(&format!("get_shell_path: fallback = {}", extended));
        extended
    })
}

/// Finds the gh CLI executable path.
/// Apps GUI on macOS don't inherit the terminal PATH, so we check known Homebrew locations.
pub fn find_gh_path() -> &'static str {
    // Homebrew on Apple Silicon
    if std::path::Path::new("/opt/homebrew/bin/gh").exists() {
        return "/opt/homebrew/bin/gh";
    }
    // Homebrew on Intel Mac
    if std::path::Path::new("/usr/local/bin/gh").exists() {
        return "/usr/local/bin/gh";
    }
    // Fallback to system PATH
    "gh"
}

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResult {
    pub code: String,
    pub url: String,
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
    let output = Command::new(find_gh_path()).args(["--version"]).output();

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
    let output = Command::new(find_gh_path()).args(["auth", "status"]).output();

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

// ============================================================================
// Codex CLI
// ============================================================================

/// Cached codex binary path resolved from the user's shell.
static CODEX_PATH: OnceLock<String> = OnceLock::new();

pub fn find_codex_path() -> &'static str {
    CODEX_PATH.get_or_init(|| {
        debug_log("find_codex_path: starting");

        // Check well-known absolute paths first
        for candidate in ["/opt/homebrew/bin/codex", "/usr/local/bin/codex"] {
            let exists = std::path::Path::new(candidate).exists();
            debug_log(&format!("find_codex_path: {} exists={}", candidate, exists));
            if exists {
                return candidate.to_string();
            }
        }

        // Try to resolve via the login shell PATH (covers npm global installs via nvm/fnm/volta)
        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
        if let Ok(output) = Command::new(&shell)
            .args(["-l", "-c", "which codex"])
            .stdin(Stdio::null())
            .stderr(Stdio::null())
            .output()
        {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                debug_log(&format!("find_codex_path: shell which = {}", path));
                if !path.is_empty() {
                    return path;
                }
            }
        }

        // Fallback
        debug_log("find_codex_path: using fallback 'codex'");
        "codex".to_string()
    })
}

/// Creates a Command for codex with the full shell PATH.
/// Codex CLI is a Node.js script (#!/usr/bin/env node), so `node` must be
/// reachable via PATH. macOS GUI apps have a minimal PATH that doesn't
/// include directories like Homebrew, nvm, fnm, or volta.
pub fn codex_command() -> Command {
    let mut cmd = Command::new(find_codex_path());
    cmd.env("PATH", get_shell_path());
    cmd
}

pub fn check_codex_installed() -> RequirementStatus {
    let name = "Codex CLI".to_string();
    let codex_path = find_codex_path();
    let shell_path = get_shell_path();
    debug_log(&format!("check_codex_installed: codex_path={}, shell_path_len={}", codex_path, shell_path.len()));

    let output = codex_command().args(["--version"]).output();

    match output {
        Ok(output) if output.status.success() => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            debug_log(&format!("check_codex_installed: OK version={}", stdout.trim()));
            RequirementStatus {
                name,
                installed: true,
                version: Some(stdout.trim().to_string()),
                error: None,
            }
        }
        Ok(output) => {
            let err = output_error_message(&output);
            debug_log(&format!("check_codex_installed: FAILED exit={}, error={}", output.status, err));
            RequirementStatus {
                name,
                installed: false,
                version: None,
                error: Some(err),
            }
        },
        Err(error) => {
            debug_log(&format!("check_codex_installed: SPAWN ERROR: {}", error));
            RequirementStatus {
                name,
                installed: false,
                version: None,
                error: Some(error.to_string()),
            }
        },
    }
}

pub fn check_codex_authenticated() -> RequirementStatus {
    let name = "Codex Authentication".to_string();
    let output = codex_command().args(["login", "status"]).output();

    match output {
        Ok(output) if output.status.success() => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            RequirementStatus {
                name,
                installed: true,
                version: Some(stdout.trim().to_string()),
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

pub fn authenticate_gh_via_browser() -> Result<AuthResult> {
    use std::io::Read;

    // Usar arquivo temporário para não interferir no processo gh
    let temp_path = std::env::temp_dir().join("gh_auth_output.txt");
    let temp_file = std::fs::File::create(&temp_path)
        .context("Failed to create temp file for gh output")?;

    let mut child = Command::new(find_gh_path())
        .args(["auth", "login", "--web", "-p", "https"])
        .stdout(Stdio::null())
        .stderr(Stdio::from(temp_file))
        .spawn()
        .context("Failed to start gh auth login")?;

    // Aguardar um pouco para o gh escrever o código no arquivo
    std::thread::sleep(std::time::Duration::from_millis(1500));

    // Ler o arquivo temporário
    let mut output = String::new();
    if let Ok(mut file) = std::fs::File::open(&temp_path) {
        let _ = file.read_to_string(&mut output);
    }

    let mut code: Option<String> = None;
    let mut url: Option<String> = None;

    for line in output.lines() {
        if let Some((_, after)) = line.split_once("one-time code:") {
            let candidate = after.trim();
            if !candidate.is_empty() {
                code = Some(candidate.to_string());
            }
        }

        if line.contains("https://") {
            for word in line.split_whitespace() {
                if word.starts_with("https://") {
                    url = Some(word.to_string());
                    break;
                }
            }
        }
    }

    // Deixar o processo gh rodando em background para completar a autenticação
    std::thread::spawn(move || {
        let _ = child.wait();
    });

    let code = code.ok_or_else(|| anyhow!("Could not find auth code. Output: {}", output))?;
    let url = url.unwrap_or_else(|| "https://github.com/login/device".to_string());

    // Abrir browser
    Command::new("open")
        .arg(&url)
        .spawn()
        .context("Failed to open browser")?;

    Ok(AuthResult { code, url })
}
