#!/usr/bin/env bash
# ============================================================
# 曜石智能科技企业官网 —— GitHub 仓库初始化脚本
# ============================================================
# 用途：建 private 仓库 + 关联本地 + 首次推送
# 用法：在项目目录下执行  bash setup-github.sh
#
# 前置条件：已执行 gh auth login
# ============================================================

set -e

REPO_NAME="obsidian-tech-website"
REPO_DESC="曜石智能科技企業官網 — CIS222/282 Group Project"
GIT_USER="Faixiang"

echo "=========================================="
echo " GitHub 仓库初始化"
echo "=========================================="
echo ""

# --- 1. 检查登录 ---
echo "[1/5] 检查 GitHub 登录状态..."
if ! gh auth status > /dev/null 2>&1; then
  echo "  ✗ 未登录。请先执行："
  echo "    gh auth login"
  echo ""
  exit 1
fi
LOGIN=$(gh api user --jq '.login')
echo "  ✓ 已登录：$LOGIN"

# --- 2. 检查仓库是否已存在 ---
echo ""
echo "[2/5] 检查仓库是否已存在..."
EXISTING=$(gh repo view "$GIT_USER/$REPO_NAME" --json name --jq '.name' 2>/dev/null || echo "")

if [ -n "$EXISTING" ]; then
  echo "  ! 仓库已存在：$GIT_USER/$REPO_NAME"
else
  echo "  创建新仓库..."
  gh repo create "$REPO_NAME" \
    --private \
    --description "$REPO_DESC" \
    --disable-issues \
    2>&1 | sed 's/^/  /'
  echo "  ✓ 仓库已创建"
fi

# --- 3. 关联远端 ---
echo ""
echo "[3/5] 关联远端仓库..."
if git remote get-url origin > /dev/null 2>&1; then
  echo "  ! origin 已存在，更新为..."
  git remote set-url origin "https://github.com/$LOGIN/$REPO_NAME.git"
else
  git remote add origin "https://github.com/$LOGIN/$REPO_NAME.git"
fi
echo "  ✓ origin → https://github.com/$LOGIN/$REPO_NAME.git"

# --- 4. 推送 ---
echo ""
echo "[4/5] 推送到远端..."
BRANCH=$(git branch --show-current)
echo "  当前分支：$BRANCH"
git push -u origin "$BRANCH" 2>&1 | sed 's/^/  /'

# --- 5. 设为 private（保险起见再确认一次）---
echo ""
echo "[5/5] 确认仓库可见性..."
VIS=$(gh repo view "$LOGIN/$REPO_NAME" --json visibility --jq '.visibility')
if [ "$VIS" = "private" ]; then
  echo "  ✓ 仓库为 private"
else
  echo "  修正可见性为 private..."
  gh repo edit "$LOGIN/$REPO_NAME" --visibility private
  echo "  ✓ 已修正"
fi

echo ""
echo "=========================================="
echo " 完成"
echo "=========================================="
echo "仓库地址：https://github.com/$LOGIN/$REPO_NAME"
echo ""
echo "后续每日上传只需三步："
echo "  1. git add -A"
echo "  2. git commit -m \"描述\""
echo "  3. git push"
echo ""