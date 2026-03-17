use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;

// ============================================================================
// Intermediate structs for deserializing `gh` CLI JSON output (camelCase)
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GhAuthor {
    login: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GhStatusCheck {
    #[serde(default)]
    status: String,
    #[serde(default)]
    conclusion: String,
    #[serde(default)]
    state: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GhPullRequestItem {
    number: u64,
    title: String,
    author: GhAuthor,
    state: String,
    created_at: String,
    updated_at: String,
    head_ref_name: String,
    base_ref_name: String,
    is_draft: bool,
    url: String,
    #[serde(default)]
    additions: u64,
    #[serde(default)]
    deletions: u64,
    #[serde(default)]
    changed_files: u64,
    #[serde(default)]
    mergeable: String,
    #[serde(default)]
    status_check_rollup: Vec<GhStatusCheck>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GhComment {
    author: GhAuthor,
    body: String,
    created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GhReviewComment {
    author: GhAuthor,
    body: String,
    path: String,
    #[serde(default)]
    line: Option<u64>,
    #[serde(default)]
    diff_hunk: String,
    created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GhReview {
    author: GhAuthor,
    state: String,
    #[serde(default)]
    body: String,
    submitted_at: String,
    #[serde(default)]
    comments: Vec<GhReviewComment>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GhPullRequestDetail {
    number: u64,
    title: String,
    #[serde(default)]
    body: String,
    author: GhAuthor,
    state: String,
    created_at: String,
    updated_at: String,
    head_ref_name: String,
    base_ref_name: String,
    is_draft: bool,
    url: String,
    #[serde(default)]
    additions: u64,
    #[serde(default)]
    deletions: u64,
    #[serde(default)]
    changed_files: u64,
    #[serde(default)]
    mergeable: String,
    #[serde(default)]
    status_check_rollup: Vec<GhStatusCheck>,
    #[serde(default)]
    comments: Vec<GhComment>,
    #[serde(default)]
    reviews: Vec<GhReview>,
}

// ============================================================================
// Output structs for Tauri IPC (snake_case — consistent with rest of app)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PullRequestItem {
    pub number: u64,
    pub title: String,
    pub author_login: String,
    pub state: String,
    pub created_at: String,
    pub updated_at: String,
    pub head_ref_name: String,
    pub base_ref_name: String,
    pub is_draft: bool,
    pub url: String,
    pub additions: u64,
    pub deletions: u64,
    pub changed_files: u64,
    pub mergeable: String,
    pub checks_status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PullRequestDetail {
    pub number: u64,
    pub title: String,
    pub body: String,
    pub author_login: String,
    pub state: String,
    pub created_at: String,
    pub updated_at: String,
    pub head_ref_name: String,
    pub base_ref_name: String,
    pub is_draft: bool,
    pub url: String,
    pub additions: u64,
    pub deletions: u64,
    pub changed_files: u64,
    pub mergeable: String,
    pub checks_status: String,
    pub comments: Vec<PrComment>,
    pub reviews: Vec<PrReview>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrComment {
    pub author_login: String,
    pub body: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrReview {
    pub author_login: String,
    pub state: String,
    pub body: String,
    pub submitted_at: String,
    pub comments: Vec<PrReviewComment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrReviewComment {
    pub author_login: String,
    pub body: String,
    pub path: String,
    pub line: Option<u64>,
    pub diff_hunk: String,
    pub created_at: String,
}

// ============================================================================
// Helper: aggregate checks status from statusCheckRollup
// ============================================================================

fn aggregate_checks_status(checks: &[GhStatusCheck]) -> String {
    if checks.is_empty() {
        return "none".to_string();
    }

    let mut has_failure = false;
    let mut has_pending = false;

    for check in checks {
        // gh returns `conclusion` for completed checks and `status` for in-progress.
        // Some checks use `state` instead (e.g. commit status contexts).
        let conclusion = check.conclusion.to_uppercase();
        let status = check.status.to_uppercase();
        let state = check.state.to_uppercase();

        if conclusion == "FAILURE"
            || conclusion == "TIMED_OUT"
            || conclusion == "CANCELLED"
            || conclusion == "ERROR"
            || state == "FAILURE"
            || state == "ERROR"
        {
            has_failure = true;
        } else if conclusion.is_empty()
            && (status == "IN_PROGRESS"
                || status == "QUEUED"
                || status == "REQUESTED"
                || status == "WAITING"
                || status == "PENDING"
                || state == "PENDING")
        {
            has_pending = true;
        }
        // SUCCESS / NEUTRAL / SKIPPED are considered passing
    }

    if has_failure {
        "failing".to_string()
    } else if has_pending {
        "pending".to_string()
    } else {
        "passing".to_string()
    }
}

// ============================================================================
// Helper: create a gh Command with correct PATH and working directory
// ============================================================================

fn gh_command(repo_path: &Path) -> Command {
    let mut cmd = Command::new(crate::setup::find_gh_path());
    cmd.current_dir(repo_path);
    cmd.env("PATH", crate::setup::get_shell_path());
    cmd
}

// ============================================================================
// Public functions
// ============================================================================

/// Lists pull requests for the repository, filtered by state.
/// `status_filter` should be one of: "open", "closed", "merged", "all".
pub fn list_pull_requests(
    repo_path: &Path,
    status_filter: &str,
) -> Result<Vec<PullRequestItem>> {
    let output = gh_command(repo_path)
        .args([
            "pr",
            "list",
            "--state",
            status_filter,
            "--json",
            "number,title,author,state,createdAt,updatedAt,headRefName,baseRefName,isDraft,url,additions,deletions,changedFiles,mergeable,statusCheckRollup",
            "--limit",
            "50",
        ])
        .output()
        .context("Failed to execute gh pr list")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow!("gh pr list failed: {}", stderr.trim()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let gh_items: Vec<GhPullRequestItem> =
        serde_json::from_str(&stdout).context("Failed to parse gh pr list JSON")?;

    let items = gh_items
        .into_iter()
        .map(|gh| PullRequestItem {
            number: gh.number,
            title: gh.title,
            author_login: gh.author.login,
            state: gh.state,
            created_at: gh.created_at,
            updated_at: gh.updated_at,
            head_ref_name: gh.head_ref_name,
            base_ref_name: gh.base_ref_name,
            is_draft: gh.is_draft,
            url: gh.url,
            additions: gh.additions,
            deletions: gh.deletions,
            changed_files: gh.changed_files,
            mergeable: gh.mergeable,
            checks_status: aggregate_checks_status(&gh.status_check_rollup),
        })
        .collect();

    Ok(items)
}

/// Gets detailed information about a single pull request, including comments and reviews.
pub fn get_pull_request_detail(
    repo_path: &Path,
    pr_number: u64,
) -> Result<PullRequestDetail> {
    let output = gh_command(repo_path)
        .args([
            "pr",
            "view",
            &pr_number.to_string(),
            "--json",
            "number,title,body,author,state,createdAt,updatedAt,headRefName,baseRefName,isDraft,url,additions,deletions,changedFiles,mergeable,statusCheckRollup,comments,reviews",
        ])
        .output()
        .context("Failed to execute gh pr view")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow!("gh pr view failed: {}", stderr.trim()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let gh: GhPullRequestDetail =
        serde_json::from_str(&stdout).context("Failed to parse gh pr view JSON")?;

    let comments = gh
        .comments
        .into_iter()
        .map(|c| PrComment {
            author_login: c.author.login,
            body: c.body,
            created_at: c.created_at,
        })
        .collect();

    let reviews = gh
        .reviews
        .into_iter()
        .map(|r| PrReview {
            author_login: r.author.login,
            state: r.state,
            body: r.body,
            submitted_at: r.submitted_at,
            comments: r
                .comments
                .into_iter()
                .map(|rc| PrReviewComment {
                    author_login: rc.author.login,
                    body: rc.body,
                    path: rc.path,
                    line: rc.line,
                    diff_hunk: rc.diff_hunk,
                    created_at: rc.created_at,
                })
                .collect(),
        })
        .collect();

    Ok(PullRequestDetail {
        number: gh.number,
        title: gh.title,
        body: gh.body,
        author_login: gh.author.login,
        state: gh.state,
        created_at: gh.created_at,
        updated_at: gh.updated_at,
        head_ref_name: gh.head_ref_name,
        base_ref_name: gh.base_ref_name,
        is_draft: gh.is_draft,
        url: gh.url,
        additions: gh.additions,
        deletions: gh.deletions,
        changed_files: gh.changed_files,
        mergeable: gh.mergeable,
        checks_status: aggregate_checks_status(&gh.status_check_rollup),
        comments,
        reviews,
    })
}

/// Gets the unified diff for a pull request.
pub fn get_pull_request_diff(repo_path: &Path, pr_number: u64) -> Result<String> {
    let output = gh_command(repo_path)
        .args(["pr", "diff", &pr_number.to_string()])
        .output()
        .context("Failed to execute gh pr diff")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow!("gh pr diff failed: {}", stderr.trim()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    Ok(stdout)
}
