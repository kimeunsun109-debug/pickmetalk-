# SuN blog daily task at 7:00 AM
$TaskName = "SuN_Blog_Daily_7AM"
$Script = "C:\Users\user\OneDrive\Desktop\blog\scripts\run_blog_daily.bat"
$WorkingDir = "C:\Users\user\OneDrive\Desktop\blog\scripts"

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
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "SuN blog daily automation"

Write-Host "OK: $TaskName registered for 07:00 daily"
Get-ScheduledTask -TaskName $TaskName | Select-Object TaskName, State
