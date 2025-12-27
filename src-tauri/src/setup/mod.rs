use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use std::process::{Command, Stdio};

/// Finds the gh CLI executable path.
/// Apps GUI on macOS don't inherit the terminal PATH, so we check known Homebrew locations.
fn find_gh_path() -> &'static str {
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
