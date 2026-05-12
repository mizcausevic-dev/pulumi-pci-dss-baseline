$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$pulumiPaths = @(
  "C:\Program Files (x86)\Pulumi",
  "C:\Program Files\Pulumi\bin",
  "$env:USERPROFILE\.pulumi\bin"
)

foreach ($candidate in $pulumiPaths) {
  if (Test-Path $candidate) {
    $env:Path = "$candidate;$env:Path"
  }
}

if (-not (Get-Command pulumi -ErrorAction SilentlyContinue)) {
  throw "Pulumi CLI not found. Install with: winget install -e --id Pulumi.Pulumi"
}

$env:PULUMI_CONFIG_PASSPHRASE = "local-preview"
$backendPath = Join-Path $repoRoot ".pulumi"
New-Item -ItemType Directory -Force -Path $backendPath | Out-Null

pulumi login "file://$backendPath"

pulumi stack select dev | Out-Null
if ($LASTEXITCODE -ne 0) {
  pulumi stack init dev
}

pulumi config set aws:region us-east-1
pulumi config set pulumi-pci-dss-baseline:region us-east-1
pulumi config set pulumi-pci-dss-baseline:organizationName northstar-payments
pulumi config set pulumi-pci-dss-baseline:environmentName dev
pulumi config set --plaintext pulumi-pci-dss-baseline:alertEmail security-ops@northstar-payments.example
pulumi config set pulumi-pci-dss-baseline:vpcCidr 10.34.0.0/16
pulumi config set pulumi-pci-dss-baseline:offlineMode true
pulumi config set --path pulumi-pci-dss-baseline:approvedIngressCidrs[0] 203.0.113.0/24
pulumi config set --path pulumi-pci-dss-baseline:approvedIngressCidrs[1] 198.51.100.0/24

pulumi preview --non-interactive
