<#
.SYNOPSIS
Sets up GCP Workload Identity Federation for GitHub Actions (ps-api develop).

.USAGE
powershell -ExecutionPolicy Bypass -File scripts/gcp/setup-workload-identity.ps1
powershell -ExecutionPolicy Bypass -File scripts/gcp/setup-workload-identity.ps1 -GithubOrg "my-org" -GithubRepo "ps-api"

.PREREQS
  1) gcloud CLI installed and logged in: gcloud auth login
  2) Owner / Editor on the performance-api-490703 project
#>

param(
  [string]$ProjectId = 'performance-api-490703',
  [string]$GithubOrg = 'lmsmediatrix',
  [string]$GithubRepo = 'Performance-API'
  [string]$PoolId = 'github-pool',
  [string]$ProviderId = 'github-provider',
  [string]$ServiceAccountName = 'github-actions-deploy-develop'
)

$ErrorActionPreference = 'Stop'

$ServiceAccountEmail = "$ServiceAccountName@$ProjectId.iam.gserviceaccount.com"

function Assert-CommandExists {
  param([Parameter(Mandatory = $true)][string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' not found. Install Google Cloud CLI: https://cloud.google.com/sdk/docs/install"
  }
}

function Confirm-GcloudAuthenticated {
  $account = (gcloud config list account --format='value(core.account)' 2>$null).Trim()
  if ([string]::IsNullOrWhiteSpace($account)) {
    throw "No active gcloud account. Run 'gcloud auth login' first."
  }
  Write-Host "Using gcloud account: $account"
}

Assert-CommandExists -Name 'gcloud'
Confirm-GcloudAuthenticated

Write-Host "=== GCP Workload Identity Federation Setup ==="
Write-Host "Project : $ProjectId"
Write-Host "Repo    : $GithubOrg/$GithubRepo"
Write-Host ""

gcloud config set project $ProjectId | Out-Null

# ── 1. Get project number ────────────────────────────────────────────────────
$ProjectNumber = (gcloud projects describe $ProjectId --format='value(projectNumber)').Trim()
Write-Host "Project number: $ProjectNumber"

# ── 2. Enable required APIs ──────────────────────────────────────────────────
Write-Host "Enabling APIs..."
gcloud services enable `
  run.googleapis.com `
  cloudbuild.googleapis.com `
  artifactregistry.googleapis.com `
  iam.googleapis.com `
  iamcredentials.googleapis.com `
  --project $ProjectId | Out-Null

# ── 3. Artifact Registry repository ─────────────────────────────────────────
Write-Host "Creating Artifact Registry repository (if missing)..."
$null = gcloud artifacts repositories describe cloud-run-source-deploy --location=asia-southeast1 --project=$ProjectId 2>$null
if ($LASTEXITCODE -ne 0) {
  gcloud artifacts repositories create cloud-run-source-deploy `
    --repository-format=docker `
    --location=asia-southeast1 `
    --description="Cloud Run source deploy" `
    --project=$ProjectId | Out-Null
} else {
  Write-Host "Artifact Registry repository already exists."
}

# ── 4. Service account ───────────────────────────────────────────────────────
Write-Host "Creating service account (if missing)..."
$null = gcloud iam service-accounts describe $ServiceAccountEmail --project $ProjectId 2>$null
if ($LASTEXITCODE -ne 0) {
  gcloud iam service-accounts create $ServiceAccountName `
    --display-name='GitHub Actions Deploy (develop)' `
    --project $ProjectId | Out-Null
} else {
  Write-Host "Service account already exists: $ServiceAccountEmail"
}

# ── 5. IAM roles ─────────────────────────────────────────────────────────────
Write-Host "Granting IAM roles..."
$roles = @(
  'roles/run.admin',
  'roles/cloudbuild.builds.editor',
  'roles/artifactregistry.writer',
  'roles/iam.serviceAccountUser',
  'roles/storage.admin'
)
foreach ($role in $roles) {
  Write-Host "  $role"
  gcloud projects add-iam-policy-binding $ProjectId `
    --member="serviceAccount:$ServiceAccountEmail" `
    --role=$role | Out-Null
}

# ── 6. Workload Identity Pool ────────────────────────────────────────────────
Write-Host "Creating Workload Identity Pool (if missing)..."
$null = gcloud iam workload-identity-pools describe $PoolId --location=global --project=$ProjectId 2>$null
if ($LASTEXITCODE -ne 0) {
  gcloud iam workload-identity-pools create $PoolId `
    --location=global `
    --display-name='GitHub Actions Pool' `
    --project=$ProjectId | Out-Null
} else {
  Write-Host "Workload Identity Pool already exists."
}

# ── 7. Workload Identity Provider ────────────────────────────────────────────
Write-Host "Creating Workload Identity Provider (if missing)..."
$null = gcloud iam workload-identity-pools providers describe $ProviderId `
  --workload-identity-pool=$PoolId --location=global --project=$ProjectId 2>$null
if ($LASTEXITCODE -ne 0) {
  gcloud iam workload-identity-pools providers create-oidc $ProviderId `
    --workload-identity-pool=$PoolId `
    --location=global `
    --issuer-uri='https://token.actions.githubusercontent.com' `
    --attribute-mapping='google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository' `
    --attribute-condition="assertion.repository == '$GithubOrg/$GithubRepo'" `
    --project=$ProjectId | Out-Null
} else {
  Write-Host "Workload Identity Provider already exists."
}

# ── 8. Bind service account to WIF pool ─────────────────────────────────────
$PoolResource = "projects/$ProjectNumber/locations/global/workloadIdentityPools/$PoolId"
Write-Host "Binding service account to Workload Identity Pool..."
gcloud iam service-accounts add-iam-policy-binding $ServiceAccountEmail `
  --project=$ProjectId `
  --role='roles/iam.workloadIdentityUser' `
  --member="principalSet://iam.googleapis.com/$PoolResource/attribute.repository/$GithubOrg/$GithubRepo" | Out-Null

# ── 9. Print workflow values ─────────────────────────────────────────────────
$ProviderResource = "$PoolResource/providers/$ProviderId"
Write-Host ""
Write-Host "======================================================"
Write-Host " Paste these values into gcp-deploy-develop.yml:"
Write-Host "======================================================"
Write-Host ""
Write-Host "  workload_identity_provider: $ProviderResource"
Write-Host "  service_account: $ServiceAccountEmail"
Write-Host ""
Write-Host "Done."
