<USER_REQUEST>
IntriHub PRD v2 (aligned with our code): Nearest-First Listing, Auto-Accept Orders and High-Alert Vendor Notifications
Product: IntriHub (website, customer app, vendor app, CPO panel, admin panel) | Version 2.0 | 8 Oct 2026 | Status: Final, ready for development
This PRD replaces v1 and is written against our real codebase: it names the files to change, the tables to add, and the rules the developer must follow before any code reaches GitHub.
1. Current system vs what to build
Most of the base already exists, so the work is mainly fixing gaps and adding checks, not building from zero. Customer app = intrihub-mobile, vendor app = intrihub-business.
Area
What exists today
What is missing
Address and coordinates
Address and Vendor tables have latitude and longitude. Haversine distance is in lib/delivery/geo.ts. Address screens: components/checkout-v2/AddressStep.tsx (web), AddressModal.tsx (customer app).
Both screens capture GPS but leave coordinates out of the save payload, so addresses are stored as text only.
Item listing
app/api/mobile/products/route.ts and lib/actions/products.ts join Vendor.
Vendor latitude and longitude are not selected. Sort is only by createdAt or popularity. No lat and lng parameters.
Order creation
createOrder() in lib/actions/orders.ts: atomic stock check, Razorpay signature check, order splits, an autoAcceptOrders flag.
No vendor online, operating-hours or radius check before auto-accept.
Vendor actions
updateVendorFulfillmentStatus in lib/actions/vendor.ts.
No reject action, no auto-cancel timeout, no refund API call, no customer cancel.
Notifications
lib/push-notifications.ts sends through the Expo Push API. Tokens sit in the Setting table. usePushNotifications.ts in the vendor app.
In the foreground the vendor app only logs to the console. No full-screen alert, looping sound, acknowledgement or heartbeat.
Native setup
AndroidManifest.xml and app.json in the vendor app.
WAKE_LOCK, USE_FULL_SCREEN_INTENT, foreground service, iOS audio background mode and an audio library are missing.
Background jobs
HTTP cron at app/api/cron/sla-checker/route.ts. socket-server/index.js.
No queue worker. The shortest cron interval our hosting allows is not yet confirmed.
Settings
StoreSettings table and lib/delivery/config.ts.
Cancel window, ready time, COD cap and alert timings are not stored.
Roles
customer, vendor, admin and cpo, checked in admin-guard.ts, mobile-auth.ts and cpo-permissions.ts.
Permissions for the new CPO and admin actions.
File names come from the code scan. The developer confirms each one against CODEBASE_NOTES_intrihub.md before editing it.
2. Mandatory delivery rules (apply to every task)
Nothing goes to GitHub until the full test suite passes, and every error is fixed before work moves on.
1. Build one feature at a time, each on its own branch (section 10).
2. After a feature is built, run the complete test plan in section 9: the new tests and every existing test. Test hard: wrong inputs, slow network, double taps, two orders at the same moment.
3. If any test fails, fix the cause and run the whole suite again. Repeat until everything passes. A failing test is never deleted, skipped or weakened to get a green result.
4. Push to GitHub only when all tests pass. No push with known errors, no bypassing checks (no --no-verify), no force push to main.
5. UI is part of done. Every screen in section 8 is checked on the website, customer app, vendor app, CPO panel and admin panel, in every state: loading, empty, error and success.
6. Existing flows must keep working: checkout, Razorpay payment, vendor fulfillment, SLA cron and rider assignment.
7. Secrets (.env values, tokens, keys) never enter commits, logs or test reports.
8. Every feature ends with a written test report (section 9): what was tested, what failed and how it was fixed.
3. Phase 0: fix before building
Feature 1 cannot work until customer address coordinates are saved, so these fixes come first and ship before any feature.
ID
Fix
Where
Done when
P0-1
Save coordinates with the address
AddressStep.tsx, AddressModal.tsx, saveUserAddress (auth.ts), addressInputSchema (schemas.ts), addresses.ts
Latitude and longitude are sent, validated for range and stored for new and edited addresses, on web and app.
P0-2
Add coordinates to old addresses
One-time script in scripts/
Dry run first, logs counts, never overwrites existing coordinates. Addresses that cannot be located stay empty and fall back to the default list order.
P0-3
Vendor coordinates
CPO and admin vendor pages
Every active vendor has valid latitude and longitude. Vendors without them show a 'location missing' flag in the CPO panel.
P0-4
Device tokens in their own table
lib/push-notifications.ts, new DeviceToken table
Tokens move out of the Setting table into DeviceToken (user, platform, token, last seen). Old tokens are migrated and the sender reads the new table.
P0-5
Foreground push handling
usePushNotifications.ts in the vendor app
A push received while the app is open opens the order screen instead of only logging to the console.
Each fix gets its own tests and its own push, so a problem in one never blocks the others.
4. Feature 1: Nearest-first item listing
When the customer's address is selected, the same item list is returned ordered by vendor distance, nearest first, with every item still visible and nothing extra shown on the cards.
ID
Requirement
F1-1
Selecting or changing the address re-orders the list on the website and the customer app.
F1-2
Distance is from the vendor's location to the selected address, using the Haversine code in lib/delivery/geo.ts. All items of one vendor share that distance.
F1-3
One single list, nearest to farthest. Not two lists or sections.
F1-4
No item is hidden, filtered out or disabled because of the address.
F1-5
No distance badge, label or extra text on item cards. The ordering is silent.
F1-6
Changing the address re-orders the list without a full page or app reload.
F1-7
No coordinates available (permission denied, old address, no address yet): the list keeps today's default order.
F1-8
Search and category filters keep working. Results inside them are also nearest first unless another sort is chosen.
F1-9
Vendors without valid coordinates go to the end of the list.
F1-10
Pagination follows the same order, so page 2 never holds an item nearer than one on page 1.
F1-11
Vendors within 100 m of each other keep today's ranking (createdAt or popularity), so the list does not shuffle between loads.
Code changes
1. app/api/mobile/products/route.ts and lib/actions/products.ts: accept validated lat and lng parameters, select the vendor's latitude and longitude, and order by distance in the database query before pagination (a raw SQL distance expression through Prisma). The cursor carries distance plus item id so paging is stable. Without lat and lng the existing code path runs unchanged.
2. Prisma schema: composite index on Vendor [latitude, longitude].
3. Website and customer app: where the selected address is read (locationStore.ts, Header.tsx, home.tsx), pass its coordinates to the list request and refetch when the address changes. The list returns to the top after a change.
4. Optional safety net (needs your confirmation): if an item's vendor cannot deliver to the address, show a clear message at cart or checkout only. Items stay visible in the list.
Done when
• The item count is identical before and after an address is selected.
• The first items belong to the vendor nearest the address, checked with at least three test vendors at known distances.
• No distance text or badge appears anywhere.
• The list API answers in under 500 ms at the 95th percentile with production-sized data.
• Behaviour is identical on website and customer app.
5. Feature 2: Auto-accept orders
An order is confirmed instantly only when it passes the seven checks below inside createOrder() in lib/actions/orders.ts; any failed check sends it to manual vendor accept instead.
Eligibility checks (run in this order, first failure stops)
1. Payment: online payment verified by the existing Razorpay signature check, or COD within the cap in step 7.
2. Vendor flag: the existing autoAcceptOrders flag is ON.
3. Online: vendor isOnline is true and the last heartbeat is under 90 seconds old (new).
4. Hours: current time is inside the vendor's operatingHours (new).
5. Stock: every item in stock, using the existing atomic stock check.
6. Radius: the delivery address is inside the vendor's service radius. An address without coordinates fails this check (new).
7. COD cap: a customer with no completed order can auto-accept COD only up to the amount set in StoreSettings. Above it, manual accept.
An order with items from several vendors is already split per vendor in createOrder(). Each split is checked separately, so one offline vendor never blocks the others. The reason for the result is stored on the order (autoAcceptReason) so CPO and admin can see why.
Status and customer wording
• An eligible order moves to the existing confirmed status in the same transaction that creates it. The customer sees 'Order confirmed', never 'Order done'.
• A failed check leaves the order in a new awaiting-vendor state. The customer sees 'Waiting for vendor to confirm'.
• The developer confirms the exact status strings in the code before adding the new one.
• On confirmation the order stores confirmedAt, readyBy (confirmedAt plus 10 minutes) and cancelWindowExpiresAt (confirmedAt plus 2 minutes). All three values come from StoreSettings.
Vendor, customer and CPO actions
Who
Action
Rule
Vendor
Auto-accept and Online switches
Both on the vendor app home screen. Turning Online off stops auto-accept for new orders.
Vendor
Cancel after auto-accept
Allowed until cancelWindowExpiresAt, with a required reason: out of stock, shop closed, emergency, other.
Vendor
Reject an awaiting-vendor order
New action. Triggers cancel, stock restore and refund.
Customer
Cancel
Allowed until cancelWindowExpiresAt. Stock is restored and a prepaid order is refunded.
CPO
Handle awaiting-vendor orders older than 5 minutes
The sla-checker cron raises them in the CPO panel. CPO can reassign or cancel with refund.
Admin
Settings
Cancel window, ready minutes, awaiting-vendor timeout and COD cap are editable.
Cancel and refund (new, handled with extra care because it moves money)
• Cancel runs in one database transaction: status change, stock restore and refund record together.
• The status update is guarded (only from allowed statuses), so a vendor cancel and a customer cancel at the same moment cannot both succeed.
• Prepaid orders call the Razorpay refund API once per order (idempotent), store the refund id and status, and retry on failure. A failed refund appears in the CPO panel. COD orders need no refund.
Done when
• An eligible order reaches confirmed within 3 seconds of placement.
• An offline vendor's order never shows confirmed until a vendor accepts it.
• A failed or unverified payment never produces a confirmed order.
• Every cancel has a stored reason, restores stock exactly once and refunds exactly once.
• Existing checkout, split orders and Razorpay verification behave as before.
6. Feature 3: High-alert vendor notification
When an order is confirmed, the vendor's phone must alert like an incoming ride request until the vendor taps Received, even with the app closed, on both Android and iOS.
Step 0: proof of concept before building
Today the vendor app only logs foreground pushes, and the manifest lacks the needed permissions, so the closed-app alert must be proven first.
• Android spike: build the vendor app (intrihub-business) as an EAS development build, because Expo Go cannot do this. Use a max-importance notification channel with a custom alarm sound, a native notification library with full-screen intent support (for example Notifee), and a foreground service while the vendor is Online.
• Pass: with the app killed and the screen locked, the popup and looping sound start within 5 seconds in 9 of 10 attempts, on each of: a Samsung, a Xiaomi, Oppo or Vivo phone, and a stock Android phone.
• Check in the spike: whether Expo Push alone wakes the app when it is killed. If not, send Android alerts directly through FCM and keep Expo Push for iOS.
• iOS spike: a Time Sensitive push with custom sound and a Live Activity both appear within 5 seconds on a locked iPhone.
• Feature 3 build starts only after both spikes pass. If one fails, the approach is changed first and the PRD updated.
What the 10 minute countdown means
The countdown is the time to get the order ready for dispatch, counted from confirmedAt. The app always shows the server value readyBy, never a timer started on the phone, so it stays correct if the app opens late. At zero the order shows 'Delayed', the vendor gets a reminder alert and the CPO panel flags it. The order is not cancelled automatically.
Alert content
Order ID, item list with quantities, total, payment mode (prepaid or COD), delivery address, countdown, and two buttons: Received (stops the sound) and Open order. The customer's phone number is masked.
Platform behaviour
Item
Android
iPhone
App closed or phone locked
Full-screen popup over the lock screen and other apps
Time Sensitive notification, custom sound (max 30 seconds), Live Activity with countdown
Sound
Loops on the alarm audio stream until Received is tapped
Plays once per notification, so the push repeats every 30 seconds
Keeping the app alive
Foreground service while Online
Not possible; faster escalation instead
Permissions to collect
Notifications, display over other apps, full-screen intent, battery Unrestricted, autostart on Xiaomi, Oppo and Vivo
Notifications, Time Sensitive on, silent switch off, IntriHub allowed in every Focus mode
App open
Full-screen in-app popup, looping sound
Full-screen in-app popup, looping sound
Native setup
WAKE_LOCK, USE_FULL_SCREEN_INTENT, FOREGROUND_SERVICE in AndroidManifest.xml and app.json
Push, audio background mode and Live Activity capability
Do not use VoIP push or CallKit to imitate a call on iPhone. Apple rejects it for non-calling apps. The Critical Alerts entitlement can be requested, but the product must not depend on it.
Escalation until Received
An escalation job reads the order alerts table (section 7). It needs to run at least every 30 seconds, so the developer must confirm what our hosting cron allows. If it is slower, run the job in socket-server or a small worker. All times below are editable in admin settings.
Step
Android
iPhone
Action
1
0 s
0 s
Push, popup and sound
2
30 s
30 s
Push again
3
60 s
60 s
Push again. On iPhone also send a WhatsApp or SMS message
4
2 min
90 s
WhatsApp or SMS message (Android), automated call (both)
5
3 min
2 min
Alert in the CPO panel with vendor and order ID
6
5 min
4 min
CPO calls the vendor, reassigns or cancels with refund
Tapping Received stops every later step. The message and call providers still need to be chosen.
Heartbeat and vendor health
• While Online, the vendor app sends a heartbeat every 30 to 60 seconds. No heartbeat for 90 seconds marks the vendor Unreachable, shown in the CPO panel, and stops auto-accept for that vendor.
• A vendor health screen lists missing permissions with a one-tap path to fix each, plus a Test alert button.
Store policy risk
Google limits full-screen intents on newer Android versions to calling and alarm style apps. Build both the full-screen popup and the high-importance notification, so if one is restricted the other still alerts. Prepare a short written justification for Play Store review.
Done when
• Android closed-app test passes the spike's pass rule on every test phone.
• iPhone locked test shows the notification and Live Activity within 5 seconds.
• The countdown on every device equals the server readyBy, even after a late open.
• Received stops the sound and all later steps. An unacknowledged order triggers every step at the set times.
• The CPO panel shows each alert as sent, delivered, acknowledged or escalated.
7. Database and API changes
All database changes are additive with safe defaults, so the live app keeps working while the migration runs.
Prisma schema
Model
Change
Why
Vendor
Add isOnline (default true), operatingHours (JSON, optional), lastHeartbeatAt (optional). Add index on [latitude, longitude]. Use the existing serviceAreaRadiusKm if it exists, otherwise add it.
Auto-accept checks and distance sorting
Address
No new fields. Latitude and longitude must be filled for new addresses (P0-1).
Distance sorting
Order and vendor split
Add autoAccepted, autoAcceptReason, confirmedAt, readyBy, cancelWindowExpiresAt, cancelReason, cancelledBy (customer, vendor, cpo or system), refundId, refundStatus.
Auto-accept, countdown, cancel and refund
OrderAlert (new)
id, orderId, vendorId, step, channel, platform, sentAt, deliveredAt, acknowledgedAt, escalatedAt.
Alert tracking and escalation
DeviceToken (new)
id, userId, role, platform, token (unique), appVersion, lastSeenAt.
Replaces tokens kept in the Setting table
StoreSettings
Add cancelWindowMinutes (2), readyMinutes (10), awaitingVendorTimeoutMinutes (5), codAutoAcceptCap, alertStepTimings (JSON).
Admin-editable values
The developer confirms the exact model names in schema.prisma first. Rules for the migration: additive only, tested on a copy of production data, and a written rollback step before it runs.
API and server changes
Paths are proposals. Follow the naming already used under app/api/mobile.
Endpoint or function
Who calls it
Purpose
Products list (app/api/mobile/products and lib/actions/products.ts)
Customer app, website
Accept lat and lng, return distance-ordered pages
Register device token
Vendor and customer apps
Write to DeviceToken
Vendor heartbeat
Vendor app
Update lastHeartbeatAt, limited to once per 20 seconds per vendor
Vendor online and auto-accept switch
Vendor app
Update isOnline and autoAcceptOrders
Order acknowledge (vendor orders, id, ack)
Vendor app
Set acknowledgedAt on the alert, stop escalation
Vendor cancel and reject
Vendor app
Cancel with reason, restore stock, refund
Customer cancel
Customer app, website
Cancel inside the window, restore stock, refund
CPO reassign and cancel
CPO panel
Handle awaiting-vendor and unreachable-vendor orders
Admin settings
Admin panel
Edit the StoreSettings values above
Alert escalation job (new) and sla-checker (extended)
Scheduler
Run the escalation steps and awaiting-vendor timeout
Every endpoint checks the caller's role (mobile-auth.ts, admin-guard.ts, cpo-permissions.ts) and ownership: a vendor can acknowledge or cancel only their own orders. Scheduler endpoints stay protected the same way the existing cron route is.
8. UI requirements by surface
Every new or changed screen must look like the existing ones and must be checked on real devices before it counts as done.
Rules for every surface
• Reuse the existing components, colours, fonts and spacing. No new visual style.
• Every screen handles four states: loading (skeleton), empty, error (with a retry button) and success.
• Mobile tap targets are at least 44 px. Text has enough contrast to read outdoors.
• Long vendor and item names, and Hindi or Kannada text, never get cut off or break the layout. New text lives in one place and not inside components, because the multi-language plan will need to translate it.
• Screens work from a 360 px phone to a desktop. No layout jump while data loads, and the keyboard never covers an input.
• Destructive actions (cancel, reject, refund) always ask for confirmation.
Screens to build or change
Surface
Screens
Specific notes
Website
Address selector and item list, checkout result, order tracking, cancel dialog
The list re-orders smoothly with no flicker and returns to the top. No badge. Order screens show 'Order confirmed' or 'Waiting for vendor to confirm', and a Cancel button with the remaining window time.
Customer app (intrihub-mobile)
AddressModal, home list, order detail, push messages
Same behaviour as the website. Saving an address sends coordinates. Push messages for confirmed and cancelled orders.
Vendor app (intrihub-business)
Home switches, high-alert order popup, orders list, cancel and reject sheets, health screen
Online and Auto-accept switches with clear on and off colours. The popup uses large text, a visible countdown and a big Received button reachable with one hand. Orders show Auto-accepted and Delayed tags. The health screen lists permissions with a fix button and a Test alert button.
CPO panel
Orders list and filters, alert status, vendor status, reassign and cancel, failed refunds
Filters: auto-accepted, awaiting vendor, delayed, cancelled. Each order shows its alert status. Vendors show Online, Unreachable or location missing.
Admin panel
Settings page, auto-accept reason view
Each value has a unit label and validation. Changes show a success message and are logged.
UI is done when
• Screenshots at 360 px, 390 px, tablet and desktop widths are attached to the test report, with no clipped text, overlap or console errors.
• All four states of each screen have been seen on screen, not assumed.
• The vendor popup is checked in bright sunlight and in a dark room.
9. Testing and quality gate
A feature is finished only when every test below passes on staging and a written test report exists.
Test layers
Layer
What is tested
Must include
Unit
Pure logic
Distance sort and 100 m tie-break, each of the seven eligibility checks passing and failing, readyBy and cancel-window times, escalation step timing, refund idempotency
Integration
createOrder and cancel paths against a test database
Eligible vendor confirmed, offline vendor, out of stock, failed payment, COD above cap, multi-vendor split, cancel restores stock once, double cancel, vendor and customer cancel at the same moment
API
Every new endpoint
Wrong role and another vendor's order are refused, bad lat and lng rejected, acknowledge safe to repeat, heartbeat limit works
Web end to end
Browser flows
Address select re-orders the list, checkout, cancel, CPO and admin screens
Mobile
Customer and vendor app flows on real devices
Address save with coordinates, list order, order status, vendor switches, popup, Received, cancel and reject
Performance
Speed under load
List API under 500 ms at the 95th percentile with production-sized data, order confirmed within 3 seconds, 50 orders placed at once
Failure injection
Things going wrong
Refund API fails, push service down, network drops, phone killed during an alert, heartbeat lost
Regression
Existing flows
Checkout, Razorpay payment, vendor fulfillment, SLA cron, rider assignment, returns
Security
Access and secrets
Role and ownership checks on every endpoint, no secrets in logs or responses
Device matrix for the vendor alert
• Android: a Samsung, a Xiaomi, Oppo or Vivo phone, and a stock Android phone, covering Android 12, 13 and 14 or newer.
• iPhone: two iOS versions, one of them 16.1 or newer.
• States on every phone: app open, app closed, app killed from recents, screen locked, battery saver on, Do Not Disturb or Focus on, silent switch on (iPhone), low volume, slow network.
Bug-fix loop
1. Write a failing test that reproduces the bug.
2. Fix the cause, not the symptom.
3. Run the whole suite again, not only the new test.
4. Repeat until there are zero failures.
5. Record the bug, its cause, the fix and the test added in the report.
Any failing test blocks the push. Bugs touching money, order status or a missed alert are top priority and block the release even if all other tests pass.
Test report (one per feature)
Feature and commit, tests run and passed, devices used, bugs found with their fixes, UI screenshots (section 8) and any known limits. A report with an open blocking bug is not accepted.
10. GitHub workflow and push gate
Code reaches GitHub only after every check has passed, and the main branch always stays in a working state.
1. Start each task on its own branch from the latest main, for example phase0/save-coordinates, feature/nearest-first, feature/auto-accept and feature/vendor-high-alert. Each repo (website and backend, intrihub-mobile, intrihub-business) gets its own branches.
2. Make small commits with a clear message saying what changed and why.
3. Before every push, run locally: lint, type check, unit and integration tests, and the build. Everything must pass.
4. Push the branch. Automatic checks run the same steps plus end-to-end tests. If any fail, fix and push again until all are green.
5. Deploy the branch to staging and run the full test plan from section 9, including the device tests. Attach the test report to the pull request.
6. Merge to main only when the automatic checks are green, staging tests pass and the report has no open blocking bug.
7. Commit the Prisma migration with the code. Apply it to staging first, then to production after a database backup, with the rollback step ready.
8. Put Feature 2 and Feature 3 behind switches in StoreSettings, so they can be turned off without a new release.
9. After release, watch errors, refunds and missed alerts for 48 hours. If any top-priority problem appears, switch the feature off, fix it and repeat steps 3 to 6.
Hard rules
• No secrets in commits: .env values, tokens and keys stay out of git, logs and reports.
• No --no-verify, no force push to main, and no skipped, disabled or deleted tests.
• Old app versions must keep working. New API fields are optional and new endpoints are additive, because some testers still run older builds.
• Mobile builds are tested on real phones before any store submission.
11. Build order, risks and open items
Start the Feature 3 spikes on day one, in parallel with Phase 0, because they carry the biggest risk. Each step below ends with testing and a push under sections 2, 9 and 10.
Build order
1. Phase 0 fixes P0-1 to P0-5.
2. Feature 1: nearest-first listing.
3. Vendor fields and switches: isOnline, operatingHours, heartbeat and the Online switch.
4. Feature 2: eligibility checks, cancel, reject and refund, released with the feature switch OFF.
5. Feature 3, part one: in-app popup with looping sound, acknowledge endpoint and OrderAlert table.
6. Feature 3, part two: closed-app alert on Android and iPhone, using the approach the spikes proved.
7. Feature 3, part three: escalation job, CPO alert status and the vendor health screen.
8. Pilot with a few vendors, then switch the features on for all vendors.
Risks
Risk
Impact
Mitigation
Closed-app alert fails on some phones
Missed orders
Early spikes, device matrix, escalation chain
Refund bug
Money lost or double refund
One transaction, one refund per order, tests, failed-refund list in the CPO panel
Missing coordinates
Wrong list order
Phase 0 fixes and the default-order fallback
Cron too slow for 30 second steps
Late escalation
Run the job in socket-server or a small worker
Play Store restricts full-screen intent
Popup may not show
High-importance notification as well, written justification
Old app versions in use
Broken screens
Additive API and optional fields
Auto-accepted order the vendor cannot fulfil
Customer trust
Eligibility checks, cancel window, cancel-rate monitoring
Open items to confirm
• The 10 minute countdown is the dispatch-ready time. If you want it to be the vendor's accept time, sections 5 and 6 change.
• The values 2 minutes (cancel window), 5 minutes (awaiting vendor), the COD cap and the escalation times are starting values, editable in admin settings.
• The checkout message for undeliverable items (section 4) is optional and not yet confirmed.
• Providers for WhatsApp or SMS messages and for automated calls are not chosen.
• The shortest cron interval on our hosting must be confirmed.
• Exact model and status names must be checked in schema.prisma and the order code before the first edit.     //   Read the attached PRD v2 fully before touching any code. Follow section 2 (delivery rules), section 9 (testing) and section 10 (GitHub push gate) strictly. Start with Phase 0 (section 3) and the Feature 3 spikes (section 6, Step 0). Work one task at a time on its own branch. After each task: run the full test suite, fix every failure and re-run until all pass, check the UI states from section 8, write the test report, and only then push to GitHub. Before the first edit, confirm the exact model names, status strings and file paths against CODEBASE_NOTES_intrihub.md and report anything that differs from the PRD.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-10-08T11:16:06+05:30.

The user's current state is as follows:
Active Document: d:\Intrihub\scripts\apply-direct-large-logo.ts (LANGUAGE_TYPESCRIPT)
Cursor is on line: 1
Other open documents:
- d:\Intrihub\scripts\apply-direct-large-logo.ts (LANGUAGE_TYPESCRIPT)
- d:\Intrihub\components\shared\LiveSidePreviewPanel.tsx (LANGUAGE_TSX)
- d:\Intrihub\scripts\test-phase4-5-6-suite.ts (LANGUAGE_TYPESCRIPT)
</ADDITIONAL_METADATA>