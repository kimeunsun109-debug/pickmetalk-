# Register Selenium blog post at 07:00 daily (Windows Task Scheduler)
$TaskName = "SuN_Blog_Selenium_7AM"
$Script = "C:\Users\user\OneDrive\Desktop\blog\scripts\run_selenium_blog.bat"
$WorkingDir = "C:\Users\user\OneDrive\Desktop\blog\scripts"

if (-not (Test-Path $Script)) {
    Write-Error "Batch not found: $Script"
    exit 1
}

$envFile = "C:\Users\user\OneDrive\Desktop\blog\.env"
if (-not (Test-Path $envFile)) {
    Write-Warning ".env not found. Copy .env.example to .env and set NAVER_ID / NAVER_PW"
}

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$Script`"" -WorkingDirectory $WorkingDir
$Trigger = New-ScheduledTaskTrigger -Daily -At "07:00"
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Selenium Naver blog auto post at 7AM"

Write-Host "OK: $TaskName registered for 07:00 daily"
Write-Host "Manual run: schtasks /Run /TN $TaskName"
Get-ScheduledTask -TaskName $TaskName | Select-Object TaskName, State
