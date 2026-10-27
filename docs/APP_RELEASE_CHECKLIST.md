# IntriHub Mobile App Release Checklist 🚀

Standard Operating Procedure (SOP) for releasing updates for **IntriHub Customer App** (`com.intrihub.app`) and **IntriHub Business App** (`com.intrihub.business`) with zero downtime and reliable in-app update prompts.

---

## 1. Version Bump (`app.json`)

Before triggering an EAS production build, bump the versions in the respective app directory:

### For Customer App (`intrihub-mobile/app.json`):
```json
{
  "expo": {
    "version": "1.2.18",            // Bump Semver (e.g., 1.2.17 -> 1.2.18)
    "android": {
      "package": "com.intrihub.app",
      "versionCode": 37             // Strictly increment by +1 (e.g., 36 -> 37)
    },
    "ios": {
      "bundleIdentifier": "com.intrihub.app",
      "buildNumber": "37"
    }
  }
}
```

### For Business App (`intrihub-business/app.json`):
```json
{
  "expo": {
    "version": "1.0.28",            // Bump Semver (e.g., 1.0.27 -> 1.0.28)
    "android": {
      "package": "com.intrihub.business",
      "versionCode": 36             // Strictly increment by +1 (e.g., 35 -> 36)
    },
    "ios": {
      "bundleIdentifier": "com.intrihub.business",
      "buildNumber": "36"
    }
  }
}
```

---

## 2. Typecheck & Local Validation

Ensure there are zero TypeScript compiler errors before building:

```bash
# Customer App
cd intrihub-mobile
npx tsc --noEmit

# Business App
cd ../intrihub-business
npx tsc --noEmit
```

---

## 3. Trigger Production Build (EAS)

Build the Android App Bundle (`.aab`):

```bash
# For Customer App:
cd intrihub-mobile
eas build --platform android --profile production

# For Business App:
cd intrihub-business
eas build --platform android --profile production
```

Download the resulting `.aab` file from EAS dashboard or submit directly:
```bash
eas submit --platform android --profile production
```

---

## 4. Google Play Console Submission

1. Go to [Google Play Console](https://play.google.com/console).
2. Select your app (**IntriHub** or **Intrihub Business**).
3. Under **Release**, go to **Production** > **Create new release**.
4. Upload the generated `.aab` bundle.
5. Enter Release Notes in English and localized languages.
6. Click **Review Release** and **Start rollout to Production**.

> ⚠️ **CRITICAL RULE:**
> **DO NOT** update the backend version policy until Google Play has approved the release and the status in Play Console shows **"Available on Google Play"**.
> If you update the backend policy early, existing users will be prompted to update to a version that is not yet downloadable from the Play Store!

---

## 5. Publish In-App Update Policy (Admin Screen)

Once the release is officially **LIVE** on Google Play Store:

1. Open **Intrihub Business App** on your device.
2. Log in with your authorized admin account (`ADMIN_ALLOWED_EMAIL`).
3. Tap **Account** (Bottom Tab) > **App Versions & In-App Updates** (under *Operations & Audit*).
   *(Alternatively: tap **Settings** > **App Release & Versions** banner).*
4. Choose the target app:
   - **Customer App** (`com.intrihub.app`) OR
   - **Business App** (`com.intrihub.business`)
5. Fill in the release details:
   - **Latest Version**: Enter the live semver (e.g., `1.2.18`).
   - **Version Code**: Enter the live integer build code (e.g., `37`).
   - **Min Supported Version**: Enter the minimum allowable version (older versions will be forced to update).
   - **Min Version Code**: Enter the minimum allowable build number.
   - **Force Update**: Toggle ON only if this is a mandatory, breaking update that blocks users until they update. Leave OFF for standard releases.
   - **Popup Title & Message**: Enter friendly text explaining why updating is beneficial.
   - **Release Notes**: Enter bullets (one per line) describing new features and fixes.
6. Tap **Save & Publish App Policy**.

---

## 6. Verification & Automated Audit

Test that the policy is active and functioning correctly:

```bash
# Test Customer App with older version (Should return updateAvailable: true)
curl -s "https://www.intrihub.com/api/mobile/app-config?app=customer&platform=android&version=1.2.17&versionCode=36"

# Test Customer App with latest version (Should return updateAvailable: false)
curl -s "https://www.intrihub.com/api/mobile/app-config?app=customer&platform=android&version=1.2.18&versionCode=37"

# Test Business App with older version (Should return updateAvailable: true)
curl -s "https://www.intrihub.com/api/mobile/app-config?app=business&platform=android&version=1.0.27&versionCode=35"

# Test Business App with latest version (Should return updateAvailable: false)
curl -s "https://www.intrihub.com/api/mobile/app-config?app=business&platform=android&version=1.0.28&versionCode=36"
```

### Audit Trail
Every update made through the Admin screen automatically creates an immutable audit record in `AdminAuditLog` recording:
- Admin user ID and email
- Timestamp of change
- IP address
- Old configuration snapshot vs New configuration snapshot

---

## 7. Update Prompt Behavior Summary

| Scenario | Trigger | Action |
|---|---|---|
| **Cold Start** | App Mount | Checks immediately. If update available, displays modal. |
| **Foreground AppState** | App returns from background | Checks backend throttled to **at most once every 6 hours**. |
| **User taps "Later"** | Optional update modal | Modal closes and suppresses prompts for **24 hours for that version**. If a newer version is released, it will prompt again. |
| **User taps "Update Now"** | Modal button | Attempts direct Play Store intent (`market://details?id=...`). If unavailable, falls back to `https://play.google.com/store/apps/details?id=...`. |
| **Force Update** | `forceUpdate: true` or installed < `minSupportedVersion` | Modal cannot be dismissed; backdrop touches and Android back button are locked until user updates. |
