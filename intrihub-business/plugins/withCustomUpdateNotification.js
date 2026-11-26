const {
  withAndroidManifest,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const SERVICE_CLASS_SUFFIX = ".notifications.IntriHubFirebaseMessagingService";
const REDIRECT_ACTIVITY_SUFFIX = ".notifications.AppUpdateRedirectActivity";

const DAY_COLORS_XML = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <color name="update_card_bg">#F2F5FB</color>
  <color name="update_card_stroke">#E2E8F0</color>
  <color name="update_badge_bg">#FFFFFF</color>
  <color name="update_badge_stroke">#E2E8F0</color>
  <color name="update_brand_text">#0F172A</color>
  <color name="update_time_text">#64748B</color>
  <color name="update_title_text">#0B1220</color>
  <color name="update_cta_bg">#003478</color>
  <color name="update_cta_text">#FFFFFF</color>
</resources>
`;

const NIGHT_COLORS_XML = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <color name="update_card_bg">#1B2230</color>
  <color name="update_card_stroke">#2A3447</color>
  <color name="update_badge_bg">#FFFFFF</color>
  <color name="update_badge_stroke">#334155</color>
  <color name="update_brand_text">#E2E8F0</color>
  <color name="update_time_text">#94A3B8</color>
  <color name="update_title_text">#FFFFFF</color>
  <color name="update_cta_bg">#1D63DC</color>
  <color name="update_cta_text">#FFFFFF</color>
</resources>
`;

const BG_CARD_XML = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
  <solid android:color="@color/update_card_bg" />
  <stroke android:width="1dp" android:color="@color/update_card_stroke" />
  <corners android:radius="20dp" />
</shape>
`;

const BG_BADGE_XML = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
  <solid android:color="@color/update_badge_bg" />
  <stroke android:width="1dp" android:color="@color/update_badge_stroke" />
  <corners android:radius="14dp" />
</shape>
`;

const BG_CTA_XML = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
  <solid android:color="@color/update_cta_bg" />
  <corners android:radius="999dp" />
</shape>
`;

const NOTIFICATION_LAYOUT_XML = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/update_card_root"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:background="@drawable/bg_update_card"
    android:gravity="center_vertical"
    android:orientation="horizontal"
    android:paddingStart="12dp"
    android:paddingTop="10dp"
    android:paddingEnd="12dp"
    android:paddingBottom="10dp">

  <FrameLayout
      android:id="@+id/update_badge_frame"
      android:layout_width="46dp"
      android:layout_height="46dp"
      android:background="@drawable/bg_update_badge"
      android:padding="5dp">

    <ImageView
        android:id="@+id/iv_update_logo"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:contentDescription="IntriHub"
        android:scaleType="fitCenter"
        android:src="@drawable/ic_update_intri_mark" />
  </FrameLayout>

  <LinearLayout
      android:layout_width="0dp"
      android:layout_height="wrap_content"
      android:layout_marginStart="11dp"
      android:layout_weight="1"
      android:orientation="vertical">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:gravity="center_vertical"
        android:orientation="horizontal">

      <TextView
          android:id="@+id/tv_app_name"
          android:layout_width="0dp"
          android:layout_height="wrap_content"
          android:layout_weight="1"
          android:ellipsize="end"
          android:maxLines="1"
          android:text="IntriHub"
          android:textColor="@color/update_brand_text"
          android:textSize="13sp"
          android:textStyle="bold" />

      <TextView
          android:id="@+id/tv_time_label"
          android:layout_width="wrap_content"
          android:layout_height="wrap_content"
          android:layout_marginStart="8dp"
          android:maxLines="1"
          android:text="now"
          android:textColor="@color/update_time_text"
          android:textSize="12sp" />
    </LinearLayout>

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="4dp"
        android:gravity="center_vertical"
        android:orientation="horizontal">

      <TextView
          android:id="@+id/tv_update_title"
          android:layout_width="0dp"
          android:layout_height="wrap_content"
          android:layout_marginEnd="10dp"
          android:layout_weight="1"
          android:ellipsize="end"
          android:maxLines="1"
          android:text="Update Available!"
          android:textColor="@color/update_title_text"
          android:textSize="16sp"
          android:textStyle="bold" />

      <TextView
          android:id="@+id/btn_update_now"
          android:layout_width="wrap_content"
          android:layout_height="wrap_content"
          android:background="@drawable/bg_update_cta"
          android:gravity="center"
          android:maxLines="1"
          android:minHeight="32dp"
          android:paddingStart="14dp"
          android:paddingTop="6dp"
          android:paddingEnd="14dp"
          android:paddingBottom="6dp"
          android:text="Update Now"
          android:textColor="@color/update_cta_text"
          android:textSize="12sp"
          android:textStyle="bold" />
    </LinearLayout>
  </LinearLayout>
</LinearLayout>
`;

const NOTIFICATION_RICH_EXPANDED_XML = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/rich_expanded_root"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:background="@drawable/bg_update_card"
    android:orientation="vertical"
    android:padding="12dp">

  <!-- Header Row: Logo + App Name + Time -->
  <LinearLayout
      android:layout_width="match_parent"
      android:layout_height="wrap_content"
      android:gravity="center_vertical"
      android:orientation="horizontal">

    <FrameLayout
        android:layout_width="32dp"
        android:layout_height="32dp"
        android:background="@drawable/bg_update_badge"
        android:padding="3dp">
      <ImageView
          android:id="@+id/iv_expanded_logo"
          android:layout_width="match_parent"
          android:layout_height="match_parent"
          android:scaleType="fitCenter"
          android:src="@drawable/ic_update_intri_mark" />
    </FrameLayout>

    <TextView
        android:id="@+id/tv_expanded_app_name"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_marginStart="8dp"
        android:layout_weight="1"
        android:ellipsize="end"
        android:maxLines="1"
        android:text="IntriHub"
        android:textColor="@color/update_brand_text"
        android:textSize="12sp"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/tv_expanded_time"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="now"
        android:textColor="@color/update_time_text"
        android:textSize="11sp" />
  </LinearLayout>

  <!-- Title & Body -->
  <TextView
      android:id="@+id/tv_expanded_title"
      android:layout_width="match_parent"
      android:layout_height="wrap_content"
      android:layout_marginTop="8dp"
      android:ellipsize="end"
      android:maxLines="2"
      android:textColor="@color/update_title_text"
      android:textSize="15sp"
      android:textStyle="bold" />

  <TextView
      android:id="@+id/tv_expanded_body"
      android:layout_width="match_parent"
      android:layout_height="wrap_content"
      android:layout_marginTop="3dp"
      android:ellipsize="end"
      android:maxLines="4"
      android:textColor="@color/update_brand_text"
      android:textSize="12sp" />

  <!-- Optional Banner Image -->
  <ImageView
      android:id="@+id/iv_expanded_banner"
      android:layout_width="match_parent"
      android:layout_height="140dp"
      android:layout_marginTop="8dp"
      android:scaleType="centerCrop"
      android:visibility="gone" />

  <!-- Bottom Action Bar: Countdown + CTA Button -->
  <LinearLayout
      android:layout_width="match_parent"
      android:layout_height="wrap_content"
      android:layout_marginTop="10dp"
      android:gravity="center_vertical"
      android:orientation="horizontal">

    <LinearLayout
        android:id="@+id/layout_countdown"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_weight="1"
        android:gravity="center_vertical"
        android:orientation="horizontal"
        android:visibility="gone">
      <TextView
          android:layout_width="wrap_content"
          android:layout_height="wrap_content"
          android:text="⏰ Ends in: "
          android:textColor="#E11D48"
          android:textSize="11sp"
          android:textStyle="bold" />
      <Chronometer
          android:id="@+id/chronometer_countdown"
          android:layout_width="wrap_content"
          android:layout_height="wrap_content"
          android:countDown="true"
          android:textColor="#E11D48"
          android:textSize="11sp"
          android:textStyle="bold" />
    </LinearLayout>

    <TextView
        android:id="@+id/btn_expanded_cta"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:background="@drawable/bg_update_cta"
        android:gravity="center"
        android:minHeight="32dp"
        android:paddingStart="14dp"
        android:paddingTop="6dp"
        android:paddingEnd="14dp"
        android:paddingBottom="6dp"
        android:text="Shop Now"
        android:textColor="@color/update_cta_text"
        android:textSize="12sp"
        android:textStyle="bold" />
  </LinearLayout>
</LinearLayout>
`;

function renderRedirectActivityKt(packageName) {
  return `package ${packageName}.notifications

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.core.app.NotificationManagerCompat

/**
 * Universal redirect Activity for IntriHub notifications.
 * Seamlessly routes to Google Play for app updates or to MainActivity for in-app whitelisted deep links.
 */
class AppUpdateRedirectActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val notificationId = intent?.getIntExtra(EXTRA_NOTIFICATION_ID, -1) ?: -1
    if (notificationId != -1) {
      try {
        NotificationManagerCompat.from(this).cancel(notificationId)
      } catch (_: Exception) {}
    }

    val deepLink = intent?.getStringExtra(EXTRA_DEEP_LINK)?.takeIf { it.isNotBlank() }
    val storeUrl = intent?.getStringExtra(EXTRA_STORE_URL)?.takeIf { it.isNotBlank() }
    val webUrl = intent?.getStringExtra(EXTRA_WEB_URL)?.takeIf { it.isNotBlank() }
    val pkg = intent?.getStringExtra(EXTRA_PACKAGE_NAME)?.takeIf { it.isNotBlank() } ?: packageName

    when {
      !storeUrl.isNullOrBlank() -> openPlayStore(storeUrl, webUrl ?: "https://play.google.com/store/apps/details?id=$pkg")
      !deepLink.isNullOrBlank() -> openDeepLink(deepLink, pkg)
      else -> openMainActivity(pkg)
    }

    finish()
  }

  private fun openDeepLink(deepLink: String, pkg: String) {
    try {
      val uri = if (deepLink.startsWith("http://") || deepLink.startsWith("https://") || deepLink.contains("://")) {
        Uri.parse(deepLink)
      } else {
        val scheme = if (pkg.contains("business")) "intrihub-biz" else "intrihub"
        Uri.parse("$scheme://$deepLink")
      }
      val appIntent = Intent(Intent.ACTION_VIEW, uri).apply {
        setPackage(pkg)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      }
      startActivity(appIntent)
    } catch (_: Exception) {
      openMainActivity(pkg)
    }
  }

  private fun openMainActivity(pkg: String) {
    try {
      val launchIntent = packageManager.getLaunchIntentForPackage(pkg)?.apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      }
      if (launchIntent != null) {
        startActivity(launchIntent)
      }
    } catch (_: Exception) {}
  }

  private fun openPlayStore(storeUrl: String, webUrl: String) {
    try {
      val playIntent = Intent(Intent.ACTION_VIEW, Uri.parse(storeUrl)).apply {
        setPackage("com.android.vending")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      startActivity(playIntent)
      return
    } catch (_: Exception) {}

    try {
      val marketIntent = Intent(Intent.ACTION_VIEW, Uri.parse(storeUrl)).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      startActivity(marketIntent)
      return
    } catch (_: Exception) {}

    try {
      val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(webUrl)).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      startActivity(browserIntent)
    } catch (_: Exception) {}
  }

  companion object {
    const val EXTRA_DEEP_LINK = "extra_deep_link"
    const val EXTRA_STORE_URL = "extra_store_url"
    const val EXTRA_WEB_URL = "extra_web_url"
    const val EXTRA_PACKAGE_NAME = "extra_package_name"
    const val EXTRA_NOTIFICATION_ID = "extra_notification_id"
  }
}
`;
}

function renderMessagingServiceKt(packageName) {
  return `package ${packageName}.notifications

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import android.view.View
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.RemoteMessage
import ${packageName}.R
import expo.modules.notifications.service.ExpoFirebaseMessagingService
import org.json.JSONObject
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

/**
 * Universal Native Notification Service for IntriHub.
 * Handles high-priority FCM data & notification payloads across all campaign types:
 * APP_UPDATE, OFFER, SALE, WISH, COUNTDOWN, STOCK_ALERT, and order lifecycles.
 * Renders full-colour branding, accent colour, banner image, native chronometer countdown,
 * and deep-link CTA action, with resilient fallback to avoid any crashes on unknown fields.
 */
class IntriHubFirebaseMessagingService : ExpoFirebaseMessagingService() {

  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    try {
      val payload = extractPayloadJson(remoteMessage.data)

      val type = payload.optString("type", remoteMessage.data["type"] ?: "").trim()
      val hasCustomFlags = type.isNotBlank() ||
        payload.has("accentColor") ||
        payload.has("countdownEndsAt") ||
        payload.has("ctaLabel") ||
        payload.has("imageUrl") ||
        remoteMessage.data.containsKey("imageUrl") ||
        remoteMessage.data.containsKey("target")

      if (hasCustomFlags) {
        showRichNativeNotification(payload, remoteMessage)
        return
      }

      super.onMessageReceived(remoteMessage)
    } catch (t: Throwable) {
      try {
        showFallbackNotification(remoteMessage)
      } catch (_: Throwable) {
        try {
          super.onMessageReceived(remoteMessage)
        } catch (_: Throwable) {}
      }
    }
  }

  private fun extractPayloadJson(data: Map<String, String>): JSONObject {
    val merged = JSONObject()
    val rawBody = data["body"]
    if (!rawBody.isNullOrBlank()) {
      try {
        val parsed = JSONObject(rawBody)
        val keys = parsed.keys()
        while (keys.hasNext()) {
          val k = keys.next()
          merged.put(k, parsed.opt(k))
        }
      } catch (_: Exception) {}
    }
    for ((k, v) in data) {
      if (k != "body" && !merged.has(k)) {
        merged.put(k, v)
      }
    }
    return merged
  }

  private fun showRichNativeNotification(payload: JSONObject, remoteMessage: RemoteMessage) {
    val isBusiness = packageName.contains("business")
    val defaultAppName = if (isBusiness) "IntriHub Business" else "IntriHub"
    val rawAppName = payload.optString("appName", "").ifBlank { defaultAppName }

    val rawTitle = payload.optString("title", "").ifBlank {
      remoteMessage.notification?.title ?: defaultAppName
    }
    val cleanTitle = rawTitle.replace(Regex("""\\s{2,}"""), " ").trim()

    val rawBody = payload.optString("body", "").ifBlank {
      payload.optString("message", "").ifBlank {
        remoteMessage.notification?.body ?: "Tap to view update"
      }
    }
    val cleanBody = rawBody.replace(Regex("""\\s{2,}"""), " ").trim()

    val type = payload.optString("type", "").trim().uppercase()
    val isAppUpdate = type == "APP_UPDATE"

    val defaultCta = if (isAppUpdate) "Update Now" else "Shop Now"
    val ctaLabel = payload.optString("ctaLabel", "").ifBlank { defaultCta }
    val timeLabel = payload.optString("timestampLabel", "").ifBlank { "now" }

    val deepLink = payload.optString("deepLink", "").ifBlank {
      payload.optString("target", "").ifBlank {
        payload.optString("ctaUrl", "")
      }
    }

    val storeUrl = if (isAppUpdate) {
      payload.optString("storeUrl", "").ifBlank { "market://details?id=$packageName" }
    } else null

    val webUrl = if (isAppUpdate) {
      payload.optString("webUrl", "").ifBlank { "https://play.google.com/store/apps/details?id=$packageName" }
    } else null

    val accentHex = payload.optString("accentColor", "").ifBlank {
      payload.optString("color", "").ifBlank { if (isBusiness) "#F26522" else "#003478" }
    }
    val accentColorInt = try {
      Color.parseColor(accentHex)
    } catch (_: Throwable) {
      Color.parseColor(if (isBusiness) "#F26522" else "#003478")
    }

    val soundUri = if (isAppUpdate) {
      Uri.parse("\${ContentResolver.SCHEME_ANDROID_RESOURCE}://$packageName/\${R.raw.ring}")
    } else {
      Uri.parse("\${ContentResolver.SCHEME_ANDROID_RESOURCE}://$packageName/\${R.raw.user_promo}")
    }
    val defaultChannel = if (isAppUpdate) DEFAULT_UPDATE_CHANNEL_ID else DEFAULT_PROMO_CHANNEL_ID
    val channelId = payload.optString("channelId", "").ifBlank { defaultChannel }
    ensureNotificationChannel(channelId, soundUri, accentColorInt)

    val notificationId = if (isAppUpdate) NOTIFICATION_ID_APP_UPDATE else (System.currentTimeMillis() % 100000).toInt()

    val redirectIntent = Intent(this, AppUpdateRedirectActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
      putExtra(AppUpdateRedirectActivity.EXTRA_NOTIFICATION_ID, notificationId)
      putExtra(AppUpdateRedirectActivity.EXTRA_PACKAGE_NAME, packageName)
      if (!deepLink.isNullOrBlank()) {
        putExtra(AppUpdateRedirectActivity.EXTRA_DEEP_LINK, deepLink)
      }
      if (!storeUrl.isNullOrBlank()) {
        putExtra(AppUpdateRedirectActivity.EXTRA_STORE_URL, storeUrl)
      }
      if (!webUrl.isNullOrBlank()) {
        putExtra(AppUpdateRedirectActivity.EXTRA_WEB_URL, webUrl)
      }
    }

    val pendingFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    } else {
      PendingIntent.FLAG_UPDATE_CURRENT
    }
    val pendingIntent = PendingIntent.getActivity(this, notificationId, redirectIntent, pendingFlags)

    val collapsedViews = RemoteViews(packageName, R.layout.notification_app_update).apply {
      setImageViewResource(R.id.iv_update_logo, R.drawable.ic_update_intri_mark)
      setTextViewText(R.id.tv_app_name, rawAppName)
      setTextViewText(R.id.tv_time_label, timeLabel)
      setTextViewText(R.id.tv_update_title, cleanTitle)
      setTextViewText(R.id.btn_update_now, ctaLabel)
      setOnClickPendingIntent(R.id.btn_update_now, pendingIntent)
      setOnClickPendingIntent(R.id.update_card_root, pendingIntent)
    }

    val expandedViews = RemoteViews(packageName, R.layout.notification_rich_expanded).apply {
      setImageViewResource(R.id.iv_expanded_logo, R.drawable.ic_update_intri_mark)
      setTextViewText(R.id.tv_expanded_app_name, rawAppName)
      setTextViewText(R.id.tv_expanded_time, timeLabel)
      setTextViewText(R.id.tv_expanded_title, cleanTitle)
      setTextViewText(R.id.tv_expanded_body, cleanBody)
      setTextViewText(R.id.btn_expanded_cta, ctaLabel)
      setOnClickPendingIntent(R.id.btn_expanded_cta, pendingIntent)
      setOnClickPendingIntent(R.id.rich_expanded_root, pendingIntent)
    }

    val rawImageUrl = payload.optString("imageUrl", "").ifBlank {
      payload.optString("image", "").ifBlank { remoteMessage.notification?.imageUrl?.toString() ?: "" }
    }
    val bannerBitmap = downloadBitmap(rawImageUrl)
    if (bannerBitmap != null) {
      expandedViews.setImageViewBitmap(R.id.iv_expanded_banner, bannerBitmap)
      expandedViews.setViewVisibility(R.id.iv_expanded_banner, View.VISIBLE)
    }

    val countdownMillis = parseCountdownMillis(payload.optString("countdownEndsAt", ""))
    val hasCountdown = countdownMillis > System.currentTimeMillis()
    if (hasCountdown) {
      val remaining = countdownMillis - System.currentTimeMillis()
      val baseTime = SystemClock.elapsedRealtime() + remaining
      expandedViews.setViewVisibility(R.id.layout_countdown, View.VISIBLE)
      expandedViews.setChronometer(R.id.chronometer_countdown, baseTime, null, true)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        expandedViews.setChronometerCountDown(R.id.chronometer_countdown, true)
      }
    }

    val builder = NotificationCompat.Builder(this, channelId)
      .setSmallIcon(R.drawable.notification_icon)
      .setColor(accentColorInt)
      .setContentTitle(cleanTitle)
      .setContentText(cleanBody)
      .setStyle(NotificationCompat.DecoratedCustomViewStyle())
      .setCustomContentView(collapsedViews)
      .setCustomBigContentView(expandedViews)
      .setCustomHeadsUpContentView(collapsedViews)
      .setLargeIcon(BitmapFactory.decodeResource(resources, R.drawable.ic_update_intri_mark))
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setSound(soundUri)
      .setAutoCancel(true)
      .setContentIntent(pendingIntent)

    if (hasCountdown) {
      builder.setUsesChronometer(true)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        builder.setChronometerCountDown(true)
      }
      builder.setWhen(countdownMillis)
    }

    if (
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
    ) {
      return
    }

    NotificationManagerCompat.from(this).notify(notificationId, builder.build())
  }

  private fun showFallbackNotification(remoteMessage: RemoteMessage) {
    val title = remoteMessage.notification?.title ?: remoteMessage.data["title"] ?: "IntriHub"
    val body = remoteMessage.notification?.body ?: remoteMessage.data["body"] ?: ""
    val channelId = DEFAULT_PROMO_CHANNEL_ID

    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
    val pendingIntent = if (launchIntent != null) {
      val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      } else {
        PendingIntent.FLAG_UPDATE_CURRENT
      }
      PendingIntent.getActivity(this, 9999, launchIntent, flags)
    } else null

    val notification = NotificationCompat.Builder(this, channelId)
      .setSmallIcon(R.drawable.notification_icon)
      .setColor(ContextCompat.getColor(this, R.color.notification_icon_color))
      .setContentTitle(title)
      .setContentText(body)
      .setAutoCancel(true)
      .setContentIntent(pendingIntent)
      .build()

    NotificationManagerCompat.from(this).notify(9999, notification)
  }

  private fun downloadBitmap(urlString: String?): Bitmap? {
    if (urlString.isNullOrBlank()) return null
    return try {
      val url = URL(urlString)
      val conn = url.openConnection() as HttpURLConnection
      conn.doInput = true
      conn.connectTimeout = 3500
      conn.readTimeout = 3500
      conn.connect()
      val input: InputStream = conn.inputStream
      BitmapFactory.decodeStream(input)
    } catch (_: Throwable) {
      null
    }
  }

  private fun parseCountdownMillis(raw: String?): Long {
    if (raw.isNullOrBlank()) return 0L
    return try {
      raw.toLong()
    } catch (_: Exception) {
      try {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        sdf.parse(raw)?.time ?: 0L
      } catch (_: Exception) {
        0L
      }
    }
  }

  private fun ensureNotificationChannel(channelId: String, soundUri: Uri, lightColorInt: Int) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

    val existing = manager.getNotificationChannel(channelId)
    if (existing != null) return

    val audioAttributes = AudioAttributes.Builder()
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .setUsage(AudioAttributes.USAGE_NOTIFICATION)
      .build()

    val name = if (channelId == DEFAULT_UPDATE_CHANNEL_ID) "App Updates & Important Alerts" else "Offers & Announcements"
    val desc = if (channelId == DEFAULT_UPDATE_CHANNEL_ID) "IntriHub app updates" else "Special offers and promotions"

    val channel = NotificationChannel(channelId, name, NotificationManager.IMPORTANCE_HIGH).apply {
      description = desc
      enableLights(true)
      lightColor = lightColorInt
      enableVibration(true)
      vibrationPattern = longArrayOf(0L, 300L, 200L, 300L)
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      setSound(soundUri, audioAttributes)
    }

    manager.createNotificationChannel(channel)
  }

  companion object {
    const val DEFAULT_UPDATE_CHANNEL_ID = "app_update_ring_v1"
    const val DEFAULT_PROMO_CHANNEL_ID = "promo_alerts_v1"
    const val NOTIFICATION_ID_APP_UPDATE = 9401
  }
}
`;
}

function writeFileIfChanged(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function syncKeepNotificationSounds(rawDir) {
  const keepPath = path.join(rawDir, "keep_notification_sounds.xml");
  const requiredTokens = [
    "@raw/ring",
    "@raw/user_promo",
    "@drawable/ic_update_intri_mark",
    "@drawable/bg_update_card",
    "@drawable/bg_update_badge",
    "@drawable/bg_update_cta",
    "@layout/notification_app_update",
    "@layout/notification_rich_expanded",
  ];
  let existingTokens = [];
  if (fs.existsSync(keepPath)) {
    const xml = fs.readFileSync(keepPath, "utf8");
    const match = xml.match(/tools:keep="([^"]*)"/);
    if (match && match[1]) {
      existingTokens = match[1].split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  const merged = Array.from(new Set([...existingTokens, ...requiredTokens]));
  const nextXml = `<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools"
    tools:keep="${merged.join(",")}" />
`;
  writeFileIfChanged(keepPath, nextXml);
}

function applyNativeFiles({ projectRoot, androidRoot, packageName }) {
  const resRoot = path.join(androidRoot, "app", "src", "main", "res");
  const pkgPath = packageName.replace(/\./g, path.sep);
  const javaNotifRoot = path.join(androidRoot, "app", "src", "main", "java", pkgPath, "notifications");

  writeFileIfChanged(path.join(resRoot, "values", "update_notification_colors.xml"), DAY_COLORS_XML);
  writeFileIfChanged(path.join(resRoot, "values-night", "update_notification_colors.xml"), NIGHT_COLORS_XML);
  writeFileIfChanged(path.join(resRoot, "drawable", "bg_update_card.xml"), BG_CARD_XML);
  writeFileIfChanged(path.join(resRoot, "drawable", "bg_update_badge.xml"), BG_BADGE_XML);
  writeFileIfChanged(path.join(resRoot, "drawable", "bg_update_cta.xml"), BG_CTA_XML);
  writeFileIfChanged(path.join(resRoot, "layout", "notification_app_update.xml"), NOTIFICATION_LAYOUT_XML);
  writeFileIfChanged(path.join(resRoot, "layout", "notification_rich_expanded.xml"), NOTIFICATION_RICH_EXPANDED_XML);

  const logoSrc = path.join(projectRoot, "assets", "notification-update-mark.png");
  if (fs.existsSync(logoSrc)) {
    const logoDest = path.join(resRoot, "drawable-xxhdpi", "ic_update_intri_mark.png");
    fs.mkdirSync(path.dirname(logoDest), { recursive: true });
    fs.copyFileSync(logoSrc, logoDest);
  }

  const rawDir = path.join(resRoot, "raw");
  fs.mkdirSync(rawDir, { recursive: true });

  const ringSrc = path.join(projectRoot, "assets", "sounds", "ring.mp3");
  if (fs.existsSync(ringSrc)) {
    fs.copyFileSync(ringSrc, path.join(rawDir, "ring.mp3"));
  }

  const promoSrc = path.join(projectRoot, "assets", "sounds", "user_promo.wav");
  if (fs.existsSync(promoSrc)) {
    fs.copyFileSync(promoSrc, path.join(rawDir, "user_promo.wav"));
  }

  syncKeepNotificationSounds(rawDir);

  writeFileIfChanged(path.join(javaNotifRoot, "AppUpdateRedirectActivity.kt"), renderRedirectActivityKt(packageName));
  writeFileIfChanged(path.join(javaNotifRoot, "IntriHubFirebaseMessagingService.kt"), renderMessagingServiceKt(packageName));
}

const withCustomUpdateNotification = (config) => {
  config = withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // Ensure tools namespace exists
    if (!manifest.$) {
      manifest.$ = {};
    }
    manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";

    // 1. Add market:// query for Android 11+ package visibility
    if (!Array.isArray(manifest.queries)) {
      manifest.queries = [{}];
    }
    const queryBlock = manifest.queries[0] || {};
    if (!Array.isArray(queryBlock.intent)) {
      queryBlock.intent = [];
    }
    const hasMarketQuery = queryBlock.intent.some((i) =>
      Array.isArray(i.data) && i.data.some((d) => d.$?.["android:scheme"] === "market")
    );
    if (!hasMarketQuery) {
      queryBlock.intent.push({
        action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
        category: [{ $: { "android:name": "android.intent.category.BROWSABLE" } }],
        data: [{ $: { "android:scheme": "market" } }],
      });
    }
    manifest.queries[0] = queryBlock;

    // 2. Remove default Expo service & register IntriHubFirebaseMessagingService + redirect Activity
    const app = manifest.application?.[0];
    if (app) {
      if (!Array.isArray(app.service)) {
        app.service = [];
      }

      // Explicitly remove default ExpoFirebaseMessagingService using tools:node="remove"
      const hasExpoRemove = app.service.some((s) => s.$?.["android:name"] === "expo.modules.notifications.service.ExpoFirebaseMessagingService");
      if (!hasExpoRemove) {
        app.service.push({
          $: {
            "android:name": "expo.modules.notifications.service.ExpoFirebaseMessagingService",
            "tools:node": "remove",
          },
        });
      }

      const hasService = app.service.some((s) => s.$?.["android:name"] === SERVICE_CLASS_SUFFIX);
      if (!hasService) {
        app.service.push({
          $: {
            "android:name": SERVICE_CLASS_SUFFIX,
            "android:exported": "false",
          },
          "intent-filter": [
            {
              $: { "android:priority": "999" },
              action: [{ $: { "android:name": "com.google.firebase.MESSAGING_EVENT" } }],
            },
          ],
        });
      }

      if (!Array.isArray(app.activity)) {
        app.activity = [];
      }
      const hasRedirect = app.activity.some((a) => a.$?.["android:name"] === REDIRECT_ACTIVITY_SUFFIX);
      if (!hasRedirect) {
        app.activity.push({
          $: {
            "android:name": REDIRECT_ACTIVITY_SUFFIX,
            "android:exported": "false",
            "android:theme": "@android:style/Theme.Translucent.NoTitleBar",
            "android:excludeFromRecents": "true",
            "android:noHistory": "true",
          },
        });
      }
    }

    return cfg;
  });

  config = withDangerousMod(config, [
    "android",
    async (cfg) => {
      const packageName = cfg.android?.package || "com.intrihub.business";
      applyNativeFiles({
        projectRoot: cfg.modRequest.projectRoot,
        androidRoot: cfg.modRequest.platformProjectRoot,
        packageName,
      });
      return cfg;
    },
  ]);

  return config;
};

withCustomUpdateNotification.applyNativeFiles = applyNativeFiles;
module.exports = withCustomUpdateNotification;
