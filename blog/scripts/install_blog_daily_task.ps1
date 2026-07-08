# SuN blog daily task at 7:00 AM
param(
    [string]$BlogRoot = ""
)

$TaskName = "SuN_Blog_Daily_7AM"

if (-not $BlogRoot) {
    $oneDrive = "C:\Users\user\OneDrive\Desktop\blog"
    if (Test-Path (Join-Path $oneDrive "scripts\run_blog_daily.bat")) {
        $BlogRoot = $oneDrive
    } else {
        $BlogRoot = Split-Path $PSScriptRoot -Parent
    }
}

$Script = Join-Path $BlogRoot "scripts\run_blog_daily.bat"
$WorkingDir = Join-Path $BlogRoot "scripts"

if (-not (Test-Path $Script)) {
    Write-Error "Batch not found: $Script"
    exit 1
}

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$Script`"" -WorkingDirectory $WorkingDir
$Trigger = New-ScheduledTaskTrigger -Daily -At "07:00"
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -WakeToRun
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "SuN blog: folder post+images, neighbor apply, comments, likes"

Write-Host "OK: $TaskName registered for 07:00 daily"
Write-Host "Blog root: $BlogRoot"
Get-ScheduledTask -TaskName $TaskName | Select-Object TaskName, State
