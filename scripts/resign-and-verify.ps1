# ============================================================
# Re-sign + Verify both AABs with production keystores
# Run after EAS builds are downloaded
# ============================================================

param(
    [string]$BusinessAAB = "d:\Intrihub\release\intrihub-business-v1.0.35-code32.aab",
    [string]$MobileAAB   = "d:\Intrihub\release\intrihub-mobile-v1.2.20-code15.aab"
)

$JAVA_HOME = $env:JAVA_HOME
if (-not $JAVA_HOME) {
    # Try common locations
    $possiblePaths = @(
        "C:\Program Files\Java\jdk-17",
        "C:\Program Files\Eclipse Adoptium\jdk-17*",
        "C:\Program Files\Microsoft\jdk-17*"
    )
    foreach ($p in $possiblePaths) {
        $found = Get-Item $p -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) { $JAVA_HOME = $found.FullName; break }
    }
}
$jarsigner = if ($JAVA_HOME) { Join-Path $JAVA_HOME "bin\jarsigner.exe" } else { "jarsigner" }
$keytool   = if ($JAVA_HOME) { Join-Path $JAVA_HOME "bin\keytool.exe"   } else { "keytool" }

Write-Host "Using jarsigner: $jarsigner" -ForegroundColor Cyan

# --- Business App ---
$BIZ_KS    = "d:\Intrihub\intrihub-business\keystore\intrihub-business-release-key.keystore"
$BIZ_ALIAS = "intrihub-biz-alias"
$BIZ_PASS  = "IntriHub@2026BizSecureKey"
$BIZ_SHA1_EXPECTED = "95:44:FB:3F:34:C6:63:22:B9:8C:5F:3E:0B:55:26:04:7B:52:7A:9B"

# --- Mobile App ---
$MOB_KS    = "d:\Intrihub\intrihub-mobile\keystore\intrihub-release-key.keystore"
$MOB_ALIAS = "intrihub-key-alias"
$MOB_PASS  = "IntriHub@2026SecureKey"
$MOB_SHA1_EXPECTED = "96:E7:C6:F4:71:F2:CA:57:3B:C3:CA:69:A2:67:60:B6:63:01:35:AC"

function Resign-AAB {
    param($aabPath, $ksPath, $alias, $pass, $expectedSHA1, $appName)

    if (-not (Test-Path $aabPath)) {
        Write-Host "[$appName] AAB not found: $aabPath" -ForegroundColor Red
        return $false
    }

    Write-Host "`n[$appName] Re-signing: $aabPath" -ForegroundColor Yellow

    # Remove existing signature
    $tmpPath = "$aabPath.unsigned.tmp"
    Copy-Item $aabPath $tmpPath -Force
    & "C:\Program Files\7-Zip\7z.exe" d $tmpPath "META-INF/*" -r 2>$null
    if ($LASTEXITCODE -ne 0) {
        # Fallback: use zip if 7zip not available
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $zip = [System.IO.Compression.ZipFile]::Open($tmpPath, 'Update')
        $toDelete = $zip.Entries | Where-Object { $_.FullName -like "META-INF/*" } | ForEach-Object { $_ }
        foreach ($entry in $toDelete) { $entry.Delete() }
        $zip.Dispose()
        Write-Host "[$appName] Removed META-INF via .NET ZIP" -ForegroundColor Gray
    }

    # Sign
    $signResult = & $jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 `
        -keystore $ksPath -storepass $pass -keypass $pass `
        $tmpPath $alias 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[$appName] SIGNING FAILED!" -ForegroundColor Red
        Write-Host $signResult
        Remove-Item $tmpPath -Force
        return $false
    }

    # Replace original
    Move-Item $tmpPath $aabPath -Force
    Write-Host "[$appName] Signed successfully." -ForegroundColor Green

    # Verify fingerprint
    $certInfo = & $keytool -printcert -jarfile $aabPath 2>&1
    $sha1Line = $certInfo | Select-String "SHA1:" | Select-Object -First 1
    $actualSHA1 = ($sha1Line -replace ".*SHA1:\s*", "").Trim()

    if ($actualSHA1 -eq $expectedSHA1) {
        Write-Host "[$appName] ✅ SHA1 MATCHES: $actualSHA1" -ForegroundColor Green
        return $true
    } else {
        Write-Host "[$appName] ❌ SHA1 MISMATCH!" -ForegroundColor Red
        Write-Host "   Expected: $expectedSHA1"
        Write-Host "   Got:      $actualSHA1"
        return $false
    }
}

# Run for both apps
$bizOk = Resign-AAB $BusinessAAB $BIZ_KS $BIZ_ALIAS $BIZ_PASS $BIZ_SHA1_EXPECTED "Business"
$mobOk = Resign-AAB $MobileAAB   $MOB_KS $MOB_ALIAS $MOB_PASS $MOB_SHA1_EXPECTED "Mobile"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Business App (code 32): $(if ($bizOk) { '✅ READY' } else { '❌ FAILED' })" -ForegroundColor $(if ($bizOk) { 'Green' } else { 'Red' })
Write-Host "Mobile App   (code 15): $(if ($mobOk) { '✅ READY' } else { '❌ FAILED' })" -ForegroundColor $(if ($mobOk) { 'Green' } else { 'Red' })

if ($bizOk -and $mobOk) {
    Write-Host "`nBoth AABs are ready for Play Console upload!" -ForegroundColor Green
    Get-ChildItem "d:\Intrihub\release\*.aab" | Select-Object Name, @{N='SizeMB';E={[math]::Round($_.Length/1MB,1)}}
}
