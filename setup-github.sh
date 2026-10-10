#!/usr/bin/env bash
# ============================================================
# 曜石智能科技企业官网 —— GitHub 仓库初始化脚本
# ============================================================
# 用途：建 private 仓库 + 关联本地 + 首次推送
# 用法：在项目目录下执行  bash setup-github.sh
#
# ⚠️ 前置条件（二选一）：
#   A. 已执行 gh auth login
#   B. 已配置 git 凭证（凭证已存在于 ~/.git-credentials）
#
# 仓库已于 2026-10-10 建立，如需重建请先在 GitHub 删除同名仓库。
# ============================================================

set -e

REPO_NAME="obsidian-tech-website"
REPO_DESC="曜石智能科技企業官網 — CIS222/282 Group Project"

echo "=========================================="
echo " GitHub 仓库初始化"
echo "=========================================="

# --- 1. 检查凭证 ---
echo ""
echo "[1/5] 检查 GitHub 凭证..."
if gh auth status > /dev/null 2>&1; then
  LOGIN=$(gh api user --jq '.login')
  echo "  ✓ gh CLI 已登录：$LOGIN"
elif git credential fill <<< "protocol=https
host=github.com" 2>/dev/null | grep -q password; then
  LOGIN=$(git credential fill <<< "protocol=https
host=github.com" | grep username | cut -d= -f2)
  echo "  ✓ git 凭证已配置：$LOGIN"
else
  echo "  ✗ 无可用凭证。请执行其一："
  echo "    gh auth login"
  echo "    或设置 ~/.git-credentials"
  exit 1
fi

# --- 2. 检查仓库 ---
echo ""
echo "[2/5] 检查仓库状态..."
if gh repo view "$LOGIN/$REPO_NAME" > /dev/null 2>&1; then
  echo "  ! 仓库已存在：$LOGIN/$REPO_NAME"
else
  echo "  创建新仓库..."
  gh repo create "$REPO_NAME" \
    --private \
    --description "$REPO_DESC" \
    --disable-issues 2>&1 | sed 's/^/  /'
  echo "  ✓ 仓库已创建"
fi

# --- 3. 关联远端 ---
echo ""
echo "[3/5] 关联远端仓库..."
if git remote get-url origin > /dev/null 2>&1; then
  git remote set-url origin "https://github.com/$LOGIN/$REPO_NAME.git"
  echo "  ✓ origin 已更新"
else
  git remote add origin "https://github.com/$LOGIN/$REPO_NAME.git"
  echo "  ✓ origin 已添加"
fi

# --- 4. 推送 ---
echo ""
echo "[4/5] 推送到远端..."
BRANCH=$(git branch --show-current)
git push -u origin "$BRANCH" 2>&1 | sed 's/^/  /'

# --- 5. 确认可见性 ---
echo ""
echo "[5/5] 确认仓库可见性..."
VIS=$(gh repo view "$LOGIN/$REPO_NAME" --json visibility --jq '.visibility')
if [ "$VIS" = "private" ]; then
  echo "  ✓ 仓库为 private"
else
  gh repo edit "$LOGIN/$REPO_NAME" --visibility private
  echo "  ✓ 已修正为 private"
fi

echo ""
echo "=========================================="
echo " 完成"
echo "=========================================="
echo "仓库地址：https://github.com/$LOGIN/$REPO_NAME"
echo ""
echo "后续每日上传只需三步："
echo "  git add -A"
echo "  git commit -m \"描述\""
echo "  git push"
echo ""