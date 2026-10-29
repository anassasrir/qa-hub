#!/bin/bash
set -e

# Configuration de l'identité Git
git config --global user.email "bot-tms@wesave.fr"
git config --global user.name "TMS Data Bot"

# Vérification du token
if [ -z "$GITLAB_TOKEN" ]; then
  echo "❌ Error: GITLAB_TOKEN is not set. Please add a Personal Access Token (PAT) with 'write_repository' scope as a CI/CD variable."
  exit 1
fi

# On utilise le GITLAB_TOKEN fourni par l'environnement pour le push
PUSH_URL="https://oauth2:${GITLAB_TOKEN}@${CI_SERVER_HOST}/${CI_PROJECT_PATH}.git"
TARGET_BRANCH="external-scan-data"
DEFAULT_BRANCH=${CI_DEFAULT_BRANCH:-main}

# Empêcher les boucles infinies si on est déjà sur la branche de données
if [ "$CI_COMMIT_REF_NAME" == "$TARGET_BRANCH" ]; then
  echo "ℹ️ Already on $TARGET_BRANCH. Skipping auto-commit to avoid loops."
  exit 0
fi

# Empêcher les race conditions lors des pipelines de Merge Request
if [ "$CI_PIPELINE_SOURCE" == "merge_request_event" ]; then
  echo "ℹ️ Running in a Merge Request pipeline. Skipping auto-commit to avoid race conditions with $DEFAULT_BRANCH."
  exit 0
fi

echo "🔍 Checking for data changes in apps/tms/data/..."

# S'assurer qu'on a bien les dernières infos de origin
git fetch origin --quiet

if [ -n "$(git status --porcelain apps/tms/data/)" ]; then
  echo "✅ Changes detected. Preparing push to $TARGET_BRANCH."
  
  # On stocke temporairement nos changements de données pour ne pas les perdre lors du checkout
  TEMP_DATA_DIR=$(mktemp -d)
  cp -r apps/tms/data/* "$TEMP_DATA_DIR/"
  
  # On bascule sur une branche propre basée sur la branche par défaut (main) la plus récente
  # Cela évite les demandes de rebase dans l'UI GitLab
  # On force le checkout avec -f pour ignorer les modifications locales (déjà sauvegardées)
  echo "Resetting $TARGET_BRANCH to a fresh state based on origin/$DEFAULT_BRANCH..."
  git checkout -f -B $TARGET_BRANCH origin/$DEFAULT_BRANCH
  
  # On restaure les données scannées
  cp -r "$TEMP_DATA_DIR"/* apps/tms/data/
  rm -rf "$TEMP_DATA_DIR"
  
  # On commit nos changements
  git add apps/tms/data/
  
  # Suppression du [skip ci] pour permettre l'exécution des pipelines et le merge auto
  # Le merge auto est géré par l'option push merge_request.merge_when_pipeline_succeeds
  COMMIT_MSG="chore(data): auto-update quality metrics"
  
  if git commit -m "$COMMIT_MSG"; then
    echo "Pushing to $TARGET_BRANCH..."
    git push \
      -o merge_request.create \
      -o merge_request.target="$DEFAULT_BRANCH" \
      -o merge_request.merge_when_pipeline_succeeds \
      -o merge_request.remove_source_branch=true \
      -o merge_request.squash=true \
      "$PUSH_URL" $TARGET_BRANCH --force
    
    echo "🚀 Data pushed successfully and MR automation triggered."
  else
    echo "ℹ️ No actual data changes detected after resetting to $DEFAULT_BRANCH."
  fi
else
  echo "ℹ️ No changes detected in working directory."
fi
