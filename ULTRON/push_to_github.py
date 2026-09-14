"""
ULTRON GitHub Push Utility
Use this script to push your repository to https://github.com/nishanthrajs01-stack/ultron

Usage:
    python push_to_github.py <YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>
Or run without arguments to enter the token when prompted.
"""

import sys
import os
import getpass
import dulwich.porcelain as dp

REPO_DIR = os.path.dirname(os.path.abspath(__file__))
REMOTE_REPO = "https://github.com/nishanthrajs01-stack/ultron.git"

def main():
    print("=" * 60)
    print("ULTRON // Git Repository Push to GitHub")
    print(f"Target: {REMOTE_REPO}")
    print("=" * 60)

    # Staging all modified & new files
    repo = dp.open_repo(REPO_DIR)
    dp.add(repo, paths=["."])
    try:
        commit_id = dp.commit(
            repo,
            message="feat: ULTRON v3.0 - Multi-Agent Engine & Vercel deployment ready",
            author="ULTRON <ultron@local.dev>"
        )
        print(f"Staged and committed latest changes: {commit_id[:8].decode() if isinstance(commit_id, bytes) else commit_id[:8]}")
    except Exception:
        print("Working tree clean / latest commit ready.")

    # Get GitHub token
    token = None
    if len(sys.argv) > 1:
        token = sys.argv[1].strip()
    else:
        token = os.environ.get("GITHUB_TOKEN")

    if not token:
        print("\nGitHub requires authentication to push.")
        print("You can generate a token at: https://github.com/settings/tokens (select 'repo' scope)")
        token = getpass.getpass("Enter your GitHub Personal Access Token (PAT): ").strip()

    if not token:
        print("[ERROR] Token is required to push to GitHub.")
        sys.exit(1)

    auth_url = f"https://oauth2:{token}@github.com/nishanthrajs01-stack/ultron.git"

    print("\nPushing repository to GitHub...")
    try:
        dp.push(repo, auth_url, refspecs=["refs/heads/master:refs/heads/main"])
        print("\n" + "=" * 60)
        print(" SUCCESS: Code successfully pushed to GitHub!")
        print(" URL: https://github.com/nishanthrajs01-stack/ultron")
        print("=" * 60)
    except Exception as e:
        # Also try pushing master:master if main fails
        try:
            dp.push(repo, auth_url, refspecs=["refs/heads/master:refs/heads/master"])
            print("\n" + "=" * 60)
            print(" SUCCESS: Code successfully pushed to GitHub!")
            print(" URL: https://github.com/nishanthrajs01-stack/ultron")
            print("=" * 60)
        except Exception as e2:
            print(f"\n[ERROR] Push failed: {e2}")
            print("Please verify that your GitHub token has write/repo permissions on 'nishanthrajs01-stack/ultron'.")

if __name__ == "__main__":
    main()
