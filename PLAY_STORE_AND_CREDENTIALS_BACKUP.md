# IntriHub — Play Store Guidelines, Keystores & Credentials Backup

This document serves as the master backup and reference for publishing, maintaining, and signing IntriHub Android Applications on the **Google Play Store**, as well as web deployment credentials.

---

## 1. IntriHub Customer Mobile App (`com.intrihub.app`)

### Identity & Configuration
- **Application Name**: Intrihub
- **Package Name**: `com.intrihub.app`
- **Current Version**: `1.0.0`
- **Release Version Code**: `3`
- **Target Android SDK**: API 35 (Android 15) *(Play Store requires min API 34)*
- **Deep Link Scheme**: `intrihub://`
- **EAS Project ID**: `7c786f97-0217-4a68-b51f-14499a3311a2`
- **EAS Account / Owner**: `sahil_sheikh78`

### Production Release Keystore
- **Keystore File Location**:
  - Primary: `intrihub-mobile/android/app/intrihub-release-key.keystore`
  - Backup: `intrihub-mobile/keystore/intrihub-release-key.keystore`
- **Keystore Alias**: `intrihub-key-alias`
- **Keystore Password**: `IntriHub@2026SecureKey`
- **Key Password**: `IntriHub@2026SecureKey`
- **Key Algorithm**: 2048-bit RSA with SHA256withRSA
- **Certificate Validity**: Wed Sep 02 2026 until Sun Jan 18 2054

### Certificate Fingerprints (Google Cloud / Firebase / Play Console)
- **SHA-1 Fingerprint**:
  ```text
  96:E7:C6:F4:71:F2:CA:57:3B:C3:CA:69:A2:67:60:B6:63:01:35:AC
  ```
- **SHA-256 Fingerprint**:
  ```text
  64:91:5B:2F:B3:87:77:AC:36:19:65:10:88:99:B9:88:32:E2:0F:E7:B8:CC:36:6A:E5:E7:5A:A5:D5:AE:00:CF
  ```

### API & Third-Party Integration Credentials
- **Production Backend API**: `https://www.intrihub.com`
- **Google OAuth Web Client ID**:
  `602084779648-k1gfeq3u4vein82tvt93d1iv5t43b8oh.apps.googleusercontent.com`
- **Google OAuth Android Client ID**:
  `602084779648-bchh5lt1n03g719qisutva4bkhjg17cb.apps.googleusercontent.com`
- **Google OAuth iOS Client ID**:
  `602084779648-omckasog9cejsf7d0p84d0aomanm7c5d.apps.googleusercontent.com`
- **Razorpay Live Key ID**: `rzp_live_TU11DGRRHXy1CH`
- **Push Notifications**: Firebase Cloud Messaging via `google-services.json` (Project: Intrihub)

---

## 2. IntriHub Business / Vendor App (`com.intrihub.business`)

### Identity & Configuration
- **Application Name**: Intrihub Business
- **Package Name**: `com.intrihub.business`
- **Current Version**: `1.0.0`
- **Release Version Code**: `1`
- **Deep Link Scheme**: `intrihub-biz://`
- **Owner**: `sahil_sheikh78`

### Production Release Keystore
- **Keystore File Location**: `intrihub-business/keystore/intrihub-business-release-key.keystore`
- **Keystore Alias**: `intrihub-biz-alias`
- **Keystore Password**: `IntriHub@2026BizSecureKey`
- **Key Password**: `IntriHub@2026BizSecureKey`
- **Certificate Validity**: Sep 10 2026 until Jan 26 2054

### Certificate Fingerprints
- **SHA-1 Fingerprint**:
  ```text
  95:44:FB:3F:34:C6:63:22:B9:8C:5F:3E:0B:55:26:04:7B:52:7A:9B
  ```
- **SHA-256 Fingerprint**:
  ```text
  32:16:19:7D:52:B6:18:01:E8:E4:5C:2E:6C:D5:4A:9C:D3:9F:93:C9:10:23:4C:7A:E1:65:99:47:24:58:2E:A0
  ```

---

## 3. Google Play Store Compliance Checklist & Answers

When filling out the Google Play Console forms, use the exact answers below:

### Mandatory Links
1. **Privacy Policy URL**:
   `https://www.intrihub.com/privacy-policy`
2. **Account & Data Deletion Web URL**:
   `https://www.intrihub.com/delete-account`
   *(Google Play Policy requirement: apps allowing account creation must provide a web deletion page).*
3. **Terms of Service**:
   `https://www.intrihub.com/terms`

### Data Safety Questionnaire Answers
| Data Type | Collected? | Shared? | Purpose | Optional / Required |
| :--- | :--- | :--- | :--- | :--- |
| **Name** | Yes | No | Account management, order delivery | Required |
| **Email Address** | Yes | No | Authentication, order updates, invoices | Required |
| **Phone Number** | Yes | No | OTP verification, delivery logistics | Required |
| **Approximate Location** | Yes | No | Pincode / City serviceability | Optional |
| **Precise Location** | Yes | No | Accurate delivery pin dropping | Optional |
| **Device & Notification ID** | Yes | No | Push notifications for order status | Optional |
| **Purchase History** | Yes | No | Order management, invoices, returns | Required |

- **Is data encrypted in transit?**: **Yes** (100% of data is sent over HTTPS).
- **Do you provide a way for users to request data deletion?**: **Yes** (Within the app under Profile -> "Delete Account & Data", and publicly via `https://www.intrihub.com/delete-account`).

### Permissions Compliance (Android 14 & 15)
- **POST_NOTIFICATIONS**: Declared and requested at runtime for Android 13+ order alerts.
- **READ_EXTERNAL_STORAGE**: Scoped to `android:maxSdkVersion="32"` to adhere to Google Play storage policy.
- **WRITE_EXTERNAL_STORAGE**: Scoped to `android:maxSdkVersion="28"` to adhere to Scoped Storage requirements.
- **READ_MEDIA_IMAGES**: Used for modern granular photo selection (avatar uploads).

### App Access / Credentials for Google Review Team
When setting up **App access** in Google Play Console (Policy > App content > App access):
- **Access Status**: Select **"All or some functionality is restricted"**
- Click **+ Add instructions** with the following exact details:

#### Instruction Form Fields:
- **Title / Name**: `Play Reviewer Customer Account`
- **Username / Email**: `playreview@intrihub.com`
- **Password**: `IntriReview#2026`
- **Any other instructions (for reviewer)**:
  ```text
  1. Open the IntriHub app. If prompted, you may continue as Guest or Sign In.
  2. Tap "Sign In" or visit Profile/Cart to prompt login.
  3. Enter email: playreview@intrihub.com and tap "Continue with Email OTP".
  4. The app will immediately present the dedicated reviewer Password screen (bypassing OTP).
  5. Enter password: IntriReview#2026 and tap "Sign In".
  6. The reviewer account has a pre-configured delivery address in Koramangala, Bengaluru and sample past orders.
  7. Browse the catalog, add products to cart, and proceed to the Checkout screen.
  8. Account is permanent, reusable, and never expires.
  ```

#### Account Attributes & Verification:
- **Email**: `playreview@intrihub.com`
- **Password**: `IntriReview#2026`
- **User ID**: `cmtvlmsdj00001p2c584jheqm`
- **Role**: `customer` (Standard customer only - strictly no admin/vendor permissions)
- **Pre-configured Address**: Flat 402, Royal Palms, 5th Block, Koramangala, Bengaluru, Karnataka - 560034
- **Security**: Permanent scrypt hash stored in database. OTP requirement bypassed ONLY for this specific dedicated reviewer account. All regular customer accounts continue to use standard Email OTP verification.

---

## 4. How to Generate a Fresh .aab File

To build a fresh release bundle directly from the terminal:

```powershell
# Navigate to the mobile android directory
cd d:\Intrihub\intrihub-mobile\android

# Clean and bundle the signed release AAB
.\gradlew.bat bundleRelease
```

The generated `.aab` file will be located at:
```text
d:\Intrihub\intrihub-mobile\android\app\build\outputs\bundle\release\app-release.aab
```

---

## 5. How to Upload `.aab` to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console).
2. Select **IntriHub** application (or click **Create app** if creating for the first time).
3. In the left navigation, go to **Release** > **Production** (or **Testing** > **Internal testing** first).
4. Click **Create new release**.
5. Upload the bundle:
   Drag and drop `app-release.aab` from `intrihub-mobile/android/app/build/outputs/bundle/release/app-release.aab`.
6. Enter Release Name (e.g. `1.0.0 (2)`).
7. Enter Release Notes in English / Hindi:
   ```text
   - Welcome to the official IntriHub mobile application!
   - Shop premium architectural, interior, tiles, and sanitaryware products.
   - Real-time order tracking, secure payments, and fast delivery.
   ```
8. Review release details and click **Save** > **Review release** > **Start rollout**.
