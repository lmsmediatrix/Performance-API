#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash scripts/gcp/setup-workload-identity.sh
# Prereqs:
#   1) gcloud CLI installed and logged in: gcloud auth login
#   2) Owner / Editor on the performance-api-490703 project
#   3) GitHub repo slug set below (GITHUB_ORG/GITHUB_REPO)

PROJECT_ID="performance-api-490703"
GITHUB_ORG="lmsmediatrix"
GITHUB_REPO="Performance-API"

POOL_ID="github-pool"
PROVIDER_ID="github-provider"
SERVICE_ACCOUNT_NAME="github-actions-deploy-develop"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "=== GCP Workload Identity Federation Setup ==="
echo "Project : ${PROJECT_ID}"
echo "Repo    : ${GITHUB_ORG}/${GITHUB_REPO}"
echo ""

gcloud config set project "${PROJECT_ID}"

# ── 1. Get project number ────────────────────────────────────────────────────
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')
echo "Project number: ${PROJECT_NUMBER}"

# ── 2. Enable required APIs ──────────────────────────────────────────────────
echo "Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  --project "${PROJECT_ID}"

# ── 3. Artifact Registry repository ─────────────────────────────────────────
echo "Creating Artifact Registry repository (if missing)..."
if ! gcloud artifacts repositories describe cloud-run-source-deploy \
      --location=asia-southeast1 --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud artifacts repositories create cloud-run-source-deploy \
    --repository-format=docker \
    --location=asia-southeast1 \
    --description="Cloud Run source deploy" \
    --project="${PROJECT_ID}"
else
  echo "Artifact Registry repository already exists."
fi

# ── 4. Service account ───────────────────────────────────────────────────────
echo "Creating service account (if missing)..."
if ! gcloud iam service-accounts describe "${SERVICE_ACCOUNT_EMAIL}" \
      --project "${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${SERVICE_ACCOUNT_NAME}" \
    --display-name="GitHub Actions Deploy (develop)" \
    --project "${PROJECT_ID}"
else
  echo "Service account already exists: ${SERVICE_ACCOUNT_EMAIL}"
fi

# ── 5. IAM roles ─────────────────────────────────────────────────────────────
echo "Granting IAM roles..."
for ROLE in roles/run.admin roles/cloudbuild.builds.editor roles/artifactregistry.writer roles/iam.serviceAccountUser roles/storage.admin; do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="${ROLE}" >/dev/null
done

# ── 6. Workload Identity Pool ────────────────────────────────────────────────
echo "Creating Workload Identity Pool (if missing)..."
if ! gcloud iam workload-identity-pools describe "${POOL_ID}" \
      --location=global --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "${POOL_ID}" \
    --location=global \
    --display-name="GitHub Actions Pool" \
    --project="${PROJECT_ID}"
else
  echo "Workload Identity Pool already exists."
fi

# ── 7. Workload Identity Provider ────────────────────────────────────────────
echo "Creating Workload Identity Provider (if missing)..."
if ! gcloud iam workload-identity-pools providers describe "${PROVIDER_ID}" \
      --workload-identity-pool="${POOL_ID}" \
      --location=global --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers create-oidc "${PROVIDER_ID}" \
    --workload-identity-pool="${POOL_ID}" \
    --location=global \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
    --attribute-condition="assertion.repository == '${GITHUB_ORG}/${GITHUB_REPO}'" \
    --project="${PROJECT_ID}"
else
  echo "Workload Identity Provider already exists."
fi

# ── 8. Bind service account to WIF pool ─────────────────────────────────────
POOL_RESOURCE="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}"
echo "Binding service account to Workload Identity Pool..."
gcloud iam service-accounts add-iam-policy-binding "${SERVICE_ACCOUNT_EMAIL}" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL_RESOURCE}/attribute.repository/${GITHUB_ORG}/${GITHUB_REPO}" >/dev/null

# ── 9. Print workflow values ─────────────────────────────────────────────────
PROVIDER_RESOURCE="${POOL_RESOURCE}/providers/${PROVIDER_ID}"
echo ""
echo "======================================================"
echo " Paste these values into gcp-deploy-develop.yml:"
echo "======================================================"
echo ""
echo "  workload_identity_provider: ${PROVIDER_RESOURCE}"
echo "  service_account: ${SERVICE_ACCOUNT_EMAIL}"
echo ""
echo "Done."
