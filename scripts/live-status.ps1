$ErrorActionPreference = "Stop"

function Write-Check($name, $value) {
  Write-Output ("{0}={1}" -f $name, $value)
}

$required = @(
  "GITHUB_TOKEN",
  "RENDER_API_KEY",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_PURGE_TOKEN"
)

$missing = @($required | Where-Object { -not $env:$_ })
if ($missing.Count -gt 0) {
  Write-Error ("Missing required env vars: " + ($missing -join ", "))
  exit 1
}

$zone = if ($env:CLOUDFLARE_ZONE_ID) { $env:CLOUDFLARE_ZONE_ID } else { "620599580cd4d65037e8d0b5af79c27e" }
$renderService = if ($env:RENDER_SERVICE_ID) { $env:RENDER_SERVICE_ID } else { "srv-d7gjdc5ckfvc73ftk79g" }

Write-Output "== SITE/API HEALTH =="
try {
  $site = Invoke-WebRequest -Uri "https://faren.com.br" -Method Head -TimeoutSec 20
  Write-Check "site_status" ([int]$site.StatusCode)
} catch {
  Write-Check "site_status" "ERROR"
}

try {
  $api = Invoke-RestMethod -Uri "https://api.faren.com.br/api/healthz" -Headers @{ "User-Agent" = "faren-uptime-monitor/1.0" } -TimeoutSec 30
  Write-Check "api_health" (($api | ConvertTo-Json -Compress))
} catch {
  Write-Check "api_health" "ERROR"
}

Write-Output "== GITHUB TOKEN CHECK =="
try {
  $gh = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers @{
    Authorization = "Bearer $($env:GITHUB_TOKEN)"
    "User-Agent"  = "faren-live-status"
    Accept        = "application/vnd.github+json"
  } -TimeoutSec 30
  Write-Check "github_login" $gh.login
} catch {
  Write-Check "github_login" "ERROR"
}

Write-Output "== RENDER CHECK =="
try {
  $deploys = Invoke-RestMethod -Uri ("https://api.render.com/v1/services/{0}/deploys?limit=1" -f $renderService) -Headers @{
    Authorization = "Bearer $($env:RENDER_API_KEY)"
    Accept        = "application/json"
  } -TimeoutSec 30
  if ($deploys.Count -gt 0) {
    Write-Check "render_last_deploy_id" $deploys[0].deploy.id
    Write-Check "render_last_deploy_status" $deploys[0].deploy.status
  } else {
    Write-Check "render_last_deploy_status" "NONE"
  }
} catch {
  Write-Check "render_last_deploy_status" "ERROR"
}

Write-Output "== CLOUDFLARE TOKEN CHECKS =="
try {
  $cfVerify = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" -Headers @{ Authorization = "Bearer $($env:CLOUDFLARE_API_TOKEN)" } -TimeoutSec 30
  Write-Check "cf_api_token_status" $cfVerify.result.status
} catch {
  Write-Check "cf_api_token_status" "ERROR"
}

try {
  $cfPurgeVerify = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" -Headers @{ Authorization = "Bearer $($env:CLOUDFLARE_PURGE_TOKEN)" } -TimeoutSec 30
  Write-Check "cf_purge_token_status" $cfPurgeVerify.result.status
} catch {
  Write-Check "cf_purge_token_status" "ERROR"
}

Write-Output "== CLOUDFLARE DNS SNAPSHOT =="
try {
  $dns = Invoke-RestMethod -Uri ("https://api.cloudflare.com/client/v4/zones/{0}/dns_records?per_page=100" -f $zone) -Headers @{ Authorization = "Bearer $($env:CLOUDFLARE_API_TOKEN)" } -TimeoutSec 30
  $targets = $dns.result | Where-Object { $_.name -in @("faren.com.br", "www.faren.com.br", "api.faren.com.br") } | Select-Object name, type, content, proxied
  foreach ($record in $targets) {
    Write-Output ($record | ConvertTo-Json -Compress)
  }
} catch {
  Write-Check "cf_dns" "ERROR"
}
