# === Kiosk Full Setup ===
# Right-click -> "Run with PowerShell as Administrator"
# Or: powershell -ExecutionPolicy Bypass -File kiosk-setup.ps1

Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force

# --- Install Node.js if missing ---
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Node.js via winget..." -ForegroundColor Yellow
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

# --- Install Git if missing ---
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Git via winget..." -ForegroundColor Yellow
    winget install Git.Git --accept-source-agreements --accept-package-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

# --- Clone or pull repo ---
$repoDir = "$env:USERPROFILE\Desktop\yaobraz"
if (Test-Path $repoDir) {
    Write-Host "Pulling latest..." -ForegroundColor Cyan
    Set-Location $repoDir
    git pull origin main
} else {
    Write-Host "Cloning repo..." -ForegroundColor Cyan
    git clone https://github.com/appamadaDhammi/yaobraz.git $repoDir
    Set-Location $repoDir
}

# --- Install dependencies ---
Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
npm install

# --- Firewall ---
Write-Host "Opening port 5173..." -ForegroundColor Cyan
Remove-NetFirewallRule -DisplayName "Vite Dev Server" -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -Port 5173 -Protocol TCP -Action Allow | Out-Null

# --- Scheduled task (auto-start on login) ---
Write-Host "Setting up auto-start..." -ForegroundColor Cyan
Unregister-ScheduledTask -TaskName "KioskStart" -Confirm:$false -ErrorAction SilentlyContinue
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c cd /d $repoDir && npm run kiosk"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = "PT1M"
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "KioskStart" -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest | Out-Null

# --- Auto-login ---
Write-Host "Setting up auto-login..." -ForegroundColor Cyan
$RegPath = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
Set-ItemProperty -Path $RegPath -Name AutoAdminLogon -Value "1"
Set-ItemProperty -Path $RegPath -Name DefaultUserName -Value $env:USERNAME
Set-ItemProperty -Path $RegPath -Name DefaultPassword -Value ""

# --- Disable sleep/screensaver/notifications ---
Write-Host "Disabling sleep and notifications..." -ForegroundColor Cyan
powercfg /change standby-timeout-ac 0
powercfg /change monitor-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
Set-ItemProperty -Path "HKCU:\Control Panel\Desktop" -Name ScreenSaveActive -Value "0"
New-Item -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Notifications\Settings" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Notifications\Settings" -Name NOC_GLOBAL_SETTING_TOASTS_ENABLED -Value 0

# --- Done ---
Write-Host ""
Write-Host "=== Setup complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Shortcuts:" -ForegroundColor Yellow
Write-Host "  Shift+Alt+R  - Reload game"
Write-Host "  Shift+Alt+K  - Toggle cursor"
Write-Host "  Shift+Alt+Q  - Quit kiosk"
Write-Host "  Ctrl+Shift+I - DevTools"
Write-Host ""
Write-Host "Settings: http://<IP>:5173/settings" -ForegroundColor Yellow
Write-Host ""

# --- Start kiosk now ---
Write-Host "Starting kiosk..." -ForegroundColor Green
Start-ScheduledTask -TaskName "KioskStart"
