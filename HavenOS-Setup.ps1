.category-number { color: #9aaa9a; font-size: 9px; letter-spacing: 1px; }
.category-name { margin-top: 13px; font-size: 14px; font-weight: 750; }
.category-detail { margin-top: 4px; color: #829087; font-size: 10px; }
.category-arrow { align-self: flex-end; margin-top: 8px; color: #78917a; }
.principles { display: grid; grid-template-columns: .9fr 1.1fr; gap: 10vw; padding: 100px clamp(22px, 7vw, 112px); background: var(--deep); color: #f3f2e9; }
.principles h2 { margin-top: 18px; }
.principles h2 em { color: #b3c6ac; }
.principle-list { display: grid; gap: 22px; }
.principle-list article { padding-bottom: 18px; border-bottom: 1px solid #ffffff24; }
.principle-list strong { color: #c4d0bd; font-size: 11px; letter-spacing: 1px; }
.principle-list p { max-width: 450px; margin: 9px 0 0; color: #b5c0b7; font-size: 13px; line-height: 1.8; }
.footer { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 35px; padding: 28px clamp(22px, 7vw, 112px); background: #0c1c17; color: #e9eee6; }
.footer .brand { font-size: 18px; }
.footer .brand-mark { width: 31px; height: 31px; }
.footer p { max-width: 550px; margin: 0; color: #9eada2; font-size: 10px; line-height: 1.7; }
.footer-note { color: #8d9d91; font-size: 10px; }
@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; gap: 45px; }
  .hero-visual { min-height: 380px; max-width: 650px; width: 100%; margin: 0 auto; }
  .category-grid { grid-template-columns: repeat(2, 1fr); }
  .principles { grid-template-columns: 1fr; gap: 45px; }
}
@media (max-width: 600px) {
  .topbar { height: 68px; }
  .topbar nav { gap: 13px; font-size: 11px; }
  .topbar nav a:first-child { display: none; }
  .brand { font-size: 19px; }
  .hero { padding-top: 52px; padding-bottom: 60px; }
  h1 { font-size: clamp(43px, 12vw, 60px); letter-spacing: -2px; }
  .hero-description { font-size: 14px; }
  .search-panel { padding: 17px; }
  .location-row { flex-direction: column; }
  .location-input-wrap { min-height: 46px; }
  .location-row button { min-height: 46px; }
  .hero-visual { min-height: 320px; }
  .visual-sun { width: 145px; height: 145px; }
  .section-heading { align-items: flex-start; flex-direction: column; }
  .category-grid { gap: 8px; }
  .category-card { min-height: 126px; padding: 13px; }
  .category-name { font-size: 12px; }
  .resource-section, .principles { padding-top: 65px; padding-bottom: 70px; }
  .footer { grid-template-columns: 1fr; gap: 14px; }
}
'@

$files["README-HAVENOS-SETUP.md"] = @'
# HavenOS starter application

## Current scope

This repository now has a React + TypeScript + Vite application foundation and a responsive landing-page prototype.

The search form is intentionally a visual/interaction placeholder. It does not yet query live resources, geocode locations, or report shelter availability.

## Data integrity principles

- Never invent provider names, service details, hours, eligibility, costs, or availability.
- Distinguish verified services from unverified discoveries.
- Preserve source attribution and retrieval/verification dates.
- Treat location sharing as optional.
- Do not require an account to find help.
- Do not collect sensitive personal details that are unnecessary to find a service.

## Resource model

The initial typed resource contract is in `src/types/resource.ts`. It includes location, service, contact, eligibility, accessibility, cost, provenance, and verification fields.

## Local development

Requires a current Node.js LTS release and npm.

```powershell
npm install
npm run dev
```

Production build:

```powershell
npm run build
```

## Planned implementation sequence

1. Resource search and filter state.
2. Validated resource data and provenance.
3. Location search and geocoding adapter.
4. Map/list synchronization.
5. Data-source adapters and caching.
6. Provider verification workflow.
7. Accessibility, mobile, and automated tests.

Do not publish unverified service listings as confirmed resources.
'@

$existing = @()
foreach ($path in $files.Keys) {
    if (Test-Path -LiteralPath $path) { $existing += $path }
}
if ($existing.Count -gt 0) {
    Write-Host "Setup stopped. These target files already exist and will not be overwritten:" -ForegroundColor Yellow
    $existing | ForEach-Object { Write-Host "  $_" }
    throw "No files were changed. Review the existing files before retrying."
}

foreach ($entry in $files.GetEnumerator()) {
    $fullPath = Join-Path $root $entry.Key
    $parent = Split-Path -Parent $fullPath
    if ($parent -and -not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    Set-Content -LiteralPath $fullPath -Value $entry.Value -Encoding utf8
    Write-Host "Created $($entry.Key)" -ForegroundColor Green
}

Write-Host ""
Write-Host "HavenOS starter files created successfully." -ForegroundColor Green
Write-Host "No existing files were overwritten. README.md was preserved."
Write-Host "Next: inspect the files, then commit and push them to GitHub."
Write-Host ""