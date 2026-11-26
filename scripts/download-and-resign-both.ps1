# ============================================================
# Download both EAS builds then re-sign with production keys
# ============================================================

$BIZ_BUILD_ID = "ea7d8614-6c8d-4751-94e1-696cecadf5c9"
$MOB_BUILD_ID = "79ab2bbf-4473-4bcf-aa9b-ee0216b36c50"
$RELEASE_DIR  = "d:\Intrihub\release"

$BIZ_OUT = "$RELEASE_DIR\intrihub-business-v1.0.35-code32.aab"
$MOB_OUT = "$RELEASE_DIR\intrihub-mobile-v1.2.20-code15.aab"

# Java tools
$javaBase = Get-ChildItem "C:\Program Files" -Directory | Where-Object { $_.Name -match "jdk|java" } | Select-Object -First 1
$jarsigner = if ($javaBase) { Join-Path $javaBase.FullName "bin\jarsigner.exe" } else { "jarsigner" }
$keytool   = if ($javaBase) { Join-Path $javaBase.FullName "bin\keytool.exe"   } else { "keytool" }

function Wait-And-Download {
    param($buildId, $outPath, $appName)

    Write-Host "`n[$appName] Polling build $buildId ..." -ForegroundColor Cyan
    
    $maxWait = 60  # max 60 polls * 60s = 60 min
    $poll = 0
    while ($poll -lt $maxWait) {
        $poll++
        Start-Sleep -Seconds 60
        
        $info = npx eas-cli build:view $buildId --json 2>$null | ConvertFrom-Json
        $status = $info.status
        Write-Host "  [$appName] Poll $poll — Status: $status" -ForegroundColor Gray
        
        if ($status -eq "finished") {
            $url = $info.artifacts.buildUrl
            if (-not $url) { $url = $info.applicationArchiveUrl }
            Write-Host "  [$appName] Build FINISHED! Downloading from: $url" -ForegroundColor Green
            Invoke-WebRequest -Uri $url -OutFile $outPath -UseBasicParsing
            Write-Host "  [$appName] Downloaded to: $outPath" -ForegroundColor Green
            return $true
        } elseif ($status -eq "errored" -or $status -eq "canceled") {
            Write-Host "  [$appName] Build $status! Check logs on Expo." -ForegroundColor Red
            return $false
        }
    }
    Write-Host "  [$appName] Timeout waiting for build." -ForegroundColor Red
    return $false
}

function Resign-AAB {
    param($aabPath, $ksPath, $alias, $pass, $expectedSHA1, $appName)

    Write-Host "`n[$appName] Re-signing $aabPath ..." -ForegroundColor Yellow

    # Remove existing META-INF (Expo's signature)
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::Open($aabPath, 'Update')
    $toDelete = @($zip.Entries | Where-Object { $_.FullName -like "META-INF/*" })
    foreach ($e in $toDelete) { $e.Delete() }
    $zip.Dispose()
    Write-Host "  [$appName] Removed Expo META-INF signature" -ForegroundColor Gray

    # Apply production keystore signature
    & $jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 `
        -keystore $ksPath -storepass $pass -keypass $pass `
        $aabPath $alias 2>&1 | Select-String -Pattern "jar signed|Warning|Error"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [$appName] SIGNING FAILED" -ForegroundColor Red
        return $false
    }

    # Verify
    $certInfo = & $keytool -printcert -jarfile $aabPath 2>&1
    $actualSHA1 = ($certInfo | Select-String "SHA1:" | Select-Object -First 1) -replace ".*SHA1:\s*", "" | ForEach-Object { $_.Trim() }

    if ($actualSHA1 -eq $expectedSHA1) {
        Write-Host "  [$appName] ✅ SHA1 OK: $actualSHA1" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  [$appName] ❌ SHA1 MISMATCH" -ForegroundColor Red
        Write-Host "     Expected: $expectedSHA1"
        Write-Host "     Got:      $actualSHA1"
        return $false
    }
}

# --- Download both (can run in parallel via jobs) ---
Write-Host "Starting download monitoring for both builds..." -ForegroundColor Cyan
Write-Host "Business build: $BIZ_BUILD_ID (code 32)"
Write-Host "Mobile build:   $MOB_BUILD_ID (code 15)"

# Check if already downloaded (resume case)
$bizReady = Test-Path $BIZ_OUT
$mobReady = Test-Path $MOB_OUT

if (-not $bizReady) {
    Set-Location d:\Intrihub\intrihub-business
    $bizReady = Wait-And-Download $BIZ_BUILD_ID $BIZ_OUT "Business"
}

if (-not $mobReady) {
    Set-Location d:\Intrihub\intrihub-mobile
    $mobReady = Wait-And-Download $MOB_BUILD_ID $MOB_OUT "Mobile"
}

# --- Re-sign ---
if ($bizReady) {
    Resign-AAB $BIZ_OUT `
        "d:\Intrihub\intrihub-business\keystore\intrihub-business-release-key.keystore" `
        "intrihub-biz-alias" "IntriHub@2026BizSecureKey" `
        "95:44:FB:3F:34:C6:63:22:B9:8C:5F:3E:0B:55:26:04:7B:52:7A:9B" "Business"
}

if ($mobReady) {
    Resign-AAB $MOB_OUT `
        "d:\Intrihub\intrihub-mobile\keystore\intrihub-release-key.keystore" `
        "intrihub-key-alias" "IntriHub@2026SecureKey" `
        "96:E7:C6:F4:71:F2:CA:57:3B:C3:CA:69:A2:67:60:B6:63:01:35:AC" "Mobile"
}

Write-Host "`n=== FINAL STATUS ===" -ForegroundColor Cyan
Get-ChildItem "$RELEASE_DIR\*.aab" | Select-Object Name, @{N='MB';E={[math]::Round($_.Length/1MB,1)}}, LastWriteTime
