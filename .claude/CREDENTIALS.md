# Development Credentials & Security Documentation

**Created:** $(date)  
**User:** Aaron Uitenbroek (auitenbroek1)  
**Setup Date:** 2025-07-06

## 🔐 Credential Storage Locations

### SSH Keys (Primary Authentication)
- **Private Key:** `~/.ssh/id_ed25519` (600 permissions)
- **Public Key:** `~/.ssh/id_ed25519.pub` (644 permissions)  
- **SSH Config:** `~/.ssh/config` (600 permissions)
- **Known Hosts:** `~/.ssh/known_hosts`
- **Key Type:** Ed25519 (most secure)
- **Key Comment:** auitenbroek@gmail.com

### Git Configuration (Global)
- **Storage:** `~/.gitconfig`
- **Name:** Aaron Uitenbroek
- **Email:** auitenbroek@gmail.com
- **Default Branch:** main
- **Pull Strategy:** merge

### GitHub Authentication
- **Method:** SSH Key Authentication + GitHub CLI Token
- **Username:** auitenbroek1
- **SSH Key Added:** 2025-07-06
- **API Rate Limit:** 5000 requests/hour (authenticated)
- **Key Title:** MacBook - Aaron Uitenbroek
- **CLI Token:** gho_**** (stored in keyring)
- **Token Scopes:** gist, read:org, repo, workflow

## 🛡️ Security Measures Implemented

### SSH Key Security
- **Algorithm:** Ed25519 (256-bit, quantum-resistant)
- **Passphrase:** None (stored in macOS Keychain)
- **Keychain Integration:** Yes (UseKeychain + AddKeysToAgent)
- **Auto-load:** Yes (ssh-agent integration)
- **File Permissions:** Properly restricted (600/644)

### SSH Configuration Features
- **Primary Connection:** github.com (standard SSH)
- **Fallback Connection:** ssh.github.com:443 (HTTPS tunnel)
- **Key Management:** Automatic keychain integration
- **Host Verification:** GitHub host keys verified

### Directory Permissions
- **~/.ssh/:** 700 (user read/write/execute only)
- **SSH Keys:** 600 (user read/write only)
- **SSH Config:** 600 (user read/write only)
- **Public Keys:** 644 (user read/write, others read)

## 🔧 Integration Status

### Claude-Flow Automation
- **Configuration:** `.claude/automation/update-system.json`
- **GitHub Integration:** SSH authenticated
- **API Access:** 5000 requests/hour limit
- **Rate Limiting:** Implemented
- **Monitoring:** GitHub repos, gists, releases

### Development Tools Available
- **Git:** v2.39.5 ✅
- **Node.js:** v22.17.0 ✅
- **npm:** v10.9.2 ✅
- **curl:** v8.7.1 ✅
- **SSH:** Native macOS SSH ✅
- **Homebrew:** v4.5.8 ✅
- **GitHub CLI (gh):** v2.74.2 ✅

### Additional Tools Installed
- **jq:** JSON processor ✅
- **tree:** v2.2.1 - Directory tree viewer ✅ 
- **ripgrep (rg):** v14.1.1 - Fast text search ✅
- **fd:** v10.2.0 - Fast file finder ✅
- **bat:** v0.25.0 - Enhanced cat with syntax highlighting ✅

### Tool Usage Examples
```bash
tree -L 2 .                    # Show directory structure
rg "search term" --type js      # Search in JavaScript files
fd --glob "*.json"              # Find all JSON files
bat file.js                     # View file with syntax highlighting
```

## 🚀 Verification Commands

### Test SSH Connection
```bash
ssh -T git@github.com
# Expected: "Hi auitenbroek1! You've successfully authenticated..."
```

### Check Git Configuration
```bash
git config --global --list
# Should show: user.name=Aaron Uitenbroek, user.email=auitenbroek@gmail.com
```

### Test Claude-Flow GitHub Integration
```bash
node .claude/automation/github-monitor.js .claude/automation/update-system.json . status
# Should show: authenticated GitHub access with 5000 rate limit
```

### Test GitHub CLI
```bash
gh auth status
# Should show: Logged in to github.com account auitenbroek1

gh api rate_limit
# Should show: 5000 request limit with high remaining count
```

### Test Complete Automation System
```bash
node .claude/automation/update-master.js . run
# Should execute: GitHub monitoring, SPARC monitoring, analysis, reporting, notifications
```

### Check SSH Key Status
```bash
ssh-add -l
# Should show: Ed25519 key loaded in ssh-agent
```

## 📋 Credential Rotation Schedule

### Recommended Actions
- **SSH Keys:** Rotate every 12 months
- **Git Config:** Update if email/name changes
- **Host Keys:** Auto-updated by SSH client
- **GitHub Access:** Monitor in GitHub Settings → SSH keys

### Security Monitoring
- **SSH Access:** Monitor GitHub Settings → Security log
- **Key Usage:** Check `ssh-add -l` periodically
- **Git Commits:** Verify author identity in commit history
- **Rate Limits:** Monitor API usage in GitHub API settings

## 🔍 Troubleshooting

### SSH Connection Issues
```bash
# Test verbose connection
ssh -T -v git@github.com

# Check SSH agent
ssh-add -l

# Reload SSH key
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

### Git Issues
```bash
# Verify config
git config --global --list

# Test with a simple command
git ls-remote git@github.com:auitenbroek1/repository.git
```

### Permission Issues
```bash
# Fix SSH permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519 ~/.ssh/config
chmod 644 ~/.ssh/id_ed25519.pub
```

## ⚠️ Security Best Practices

### What's Secure
- ✅ SSH keys stored in macOS Keychain
- ✅ Private keys never transmitted
- ✅ Proper file permissions set
- ✅ Ed25519 encryption (strongest available)
- ✅ No hardcoded passwords or tokens

### What to Never Do
- ❌ Share private SSH keys
- ❌ Commit keys to repositories
- ❌ Store passwords in plain text
- ❌ Use weak key algorithms (RSA < 2048)
- ❌ Disable host key verification

### Regular Maintenance
- 🔄 Monitor GitHub security log
- 🔄 Rotate SSH keys annually
- 🔄 Update SSH client regularly
- 🔄 Review authorized keys in GitHub
- 🔄 Check for unauthorized access

## 📞 Support Resources

### GitHub SSH Documentation
- [GitHub SSH Key Setup](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [Troubleshooting SSH](https://docs.github.com/en/authentication/troubleshooting-ssh)

### SSH Security Resources
- [SSH Best Practices](https://www.ssh.com/academy/ssh/security)
- [Ed25519 Algorithm](https://ed25519.cr.yp.to/)

---

**Note:** This documentation should be kept secure and updated when credentials change. Never commit this file to public repositories.