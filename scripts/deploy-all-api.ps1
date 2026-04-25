# Deploy completo via API (Render + GitHub Actions), sem git.
# Uso:
#   1) Defina as variáveis (ver deploy.env.example) OU crie .env.deploy na raiz do repo.
#   2) powershell -ExecutionPolicy Bypass -File .\scripts\deploy-all-api.ps1
#
# Requisitos token GitHub (PAT): escopos repo + workflow (ou fine-grained: Actions write no repo 22ez0/faren).
# Render: key com permissão de deploy no service faren-api.

$ErrorActionPreference = "Stop"
# Raiz do monorepo: .../faren-aaaaaa-1 (pasta que contem pnpm-workspace.yaml e scripts/)
$Root = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path (Join-Path $Root "pnpm-workspace.yaml"))) {
  Write-Host "ERRO: Execute a partir do monorepo (falta pnpm-workspace.yaml em $Root)." -ForegroundColor Red
  exit 1
}

function Load-DotEnv {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return }
  Get-Content $Path -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()
    if ($line -match '^\s*#' -or $line -eq '') { return }
    $eq = $line.IndexOf('=')
    if ($eq -lt 1) { return }
    $k = $line.Substring(0, $eq).Trim()
    $v = $line.Substring($eq + 1).Trim()
    if ($v.StartsWith('"') -and $v.EndsWith('"')) { $v = $v.Trim('"') }
    [System.Environment]::SetEnvironmentVariable($k, $v, "Process")
  }
}

$envFile = Join-Path $Root ".env.deploy"
Load-DotEnv $envFile

$renderKey = $env:RENDER_API_KEY
$ghToken = $env:GITHUB_TOKEN
if (-not $ghToken -and $env:GH_TOKEN) { $ghToken = $env:GH_TOKEN }

$renderServiceId = if ($env:RENDER_SERVICE_ID) { $env:RENDER_SERVICE_ID } else { "srv-d7gjdc5ckfvc73ftk79g" }
$ghOwner = "22ez0"
$ghRepo = "faren"
$workflowFile = "deploy-frontend.yml"

if (-not $renderKey) {
  Write-Host "ERRO: RENDER_API_KEY nao definida." -ForegroundColor Red
  Write-Host "Crie $envFile (veja scripts/deploy.env.example) ou: `$env:RENDER_API_KEY = '...'" -ForegroundColor Yellow
  exit 1
}
if (-not $ghToken) {
  Write-Host "ERRO: GITHUB_TOKEN (ou GH_TOKEN) nao definida." -ForegroundColor Red
  Write-Host "PAT precisa de permissao para disparar Actions (workflow_dispatch)." -ForegroundColor Yellow
  exit 1
}

Write-Host "1/2 Disparando deploy Render (API)..." -ForegroundColor Cyan
$renderBody = '{"clearCache":"do_not_clear"}'
try {
  $r = Invoke-RestMethod -Method Post `
    -Uri "https://api.render.com/v1/services/$renderServiceId/deploys" `
    -Headers @{ Authorization = "Bearer $renderKey" } `
    -ContentType "application/json" `
    -Body $renderBody
  Write-Host "   OK: deploy id $($r.id) status $($r.status)" -ForegroundColor Green
} catch {
  Write-Host "   Falha Render: $_" -ForegroundColor Red
  exit 1
}

Write-Host "2/2 Disparando GitHub Actions (workflow_dispatch) $workflowFile..." -ForegroundColor Cyan
$dispatchBody = '{"ref":"main"}'
try {
  $null = Invoke-RestMethod -Method Post `
    -Uri "https://api.github.com/repos/$ghOwner/$ghRepo/actions/workflows/$workflowFile/dispatches" `
    -Headers @{
      Authorization = "Bearer $ghToken"
      Accept        = "application/vnd.github+json"
      "X-GitHub-Api-Version" = "2022-11-28"
    } `
    -ContentType "application/json" `
    -Body $dispatchBody
  Write-Host "   OK: workflow agendado na branch main" -ForegroundColor Green
} catch {
  $err = $_.ErrorDetails.Message
  Write-Host "   Falha GitHub: $_" -ForegroundColor Red
  if ($err) { Write-Host "   $err" -ForegroundColor Red }
  exit 1
}

Write-Host ""
Write-Host "Concluido. Acompanhe:" -ForegroundColor Green
Write-Host "  Render:  https://dashboard.render.com" -ForegroundColor Gray
Write-Host "  GitHub:  https://github.com/$ghOwner/$ghRepo/actions" -ForegroundColor Gray
Write-Host "  Site:    https://faren.com.br (apos build; pode levar 2-5 min)" -ForegroundColor Gray
