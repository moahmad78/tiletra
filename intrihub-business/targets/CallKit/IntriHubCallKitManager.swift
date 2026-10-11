import Foundation
import CallKit
import PushKit
import UIKit

/**
 * IntriHubCallKitManager
 * Native Swift manager providing CallKit incoming-call full-screen ringing UI and PushKit VoIP handling.
 * Wakes the iOS vendor app even when device is locked or app is force-quit/killed.
 */
@objc(IntriHubCallKitManager)
public class IntriHubCallKitManager: NSObject, CXProviderDelegate, PKPushRegistryDelegate {

    public static let shared = IntriHubCallKitManager()

    private var provider: CXProvider?
    private var callController = CXCallController()
    private var pushRegistry: PKPushRegistry?
    private var activeCallUuid: UUID?
    private var currentOrderId: String?

    override init() {
        super.init()
        setupCallKitProvider()
        setupPushKitRegistry()
    }

    // ── 1. Configure CallKit Provider ──
    private func setupCallKitProvider() {
        let configuration = CXProviderConfiguration(localizedName: "IntriHub Business")
        configuration.supportsVideo = false
        configuration.maximumCallsPerCallGroup = 1
        configuration.maximumCallGroups = 1
        configuration.supportedHandleTypes = [.generic]
        configuration.ringtoneSound = "order_alert.wav" // Custom sound matching Android siren
        configuration.includesCallsInRecents = false

        if let logo = UIImage(named: "icon") {
            configuration.iconTemplateImageData = logo.pngData()
        }

        self.provider = CXProvider(configuration: configuration)
        self.provider?.setDelegate(self, queue: nil)
    }

    // ── 2. Configure PushKit VoIP Registry ──
    private func setupPushKitRegistry() {
        let registry = PKPushRegistry(queue: DispatchQueue.main)
        registry.delegate = self
        registry.desiredPushTypes = [.voIP]
        self.pushRegistry = registry
    }

    // ── PKPushRegistryDelegate: Token Received ──
    public func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
        if type == .voIP {
            let tokenHex = pushCredentials.token.map { String(format: "%02.2hhx", $0) }.joined()
            print("[PushKit] VoIP Push Token registered: \(tokenHex)")
            self.sendVoipTokenToBackend(token: tokenHex)
        }
    }

    public func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
        print("[PushKit] VoIP Push Token invalidated")
    }

    // ── PKPushRegistryDelegate: Incoming VoIP Push Received ──
    public func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, completionHandler: @escaping () -> Void) {
        guard type == .voIP else {
            completionHandler()
            return
        }

        let dict = payload.dictionaryPayload
        let orderId = dict["orderId"] as? String ?? "new_order"
        let amount = dict["amount"] as? Double ?? (dict["amount"] as? Int).map { Double($0) } ?? 0.0
        let customerArea = dict["customerArea"] as? String ?? "Incoming Order"

        self.currentOrderId = orderId
        let uuid = UUID()
        self.activeCallUuid = uuid

        let callUpdate = CXCallUpdate()
        callUpdate.remoteHandle = CXHandle(type: .generic, value: "IntriHub Delivery")
        callUpdate.localizedCallerName = "New Order: ₹\(Int(amount)) • \(customerArea)"
        callUpdate.hasVideo = false
        callUpdate.supportsHolding = false
        callUpdate.supportsGrouping = false
        callUpdate.supportsUngrouping = false
        callUpdate.supportsDTMF = false

        // CRITICAL: Must synchronously report incoming call within push callback or iOS terminates app
        self.provider?.reportNewIncomingCall(with: uuid, update: callUpdate) { error in
            if let error = error {
                print("[CallKit] Error reporting new incoming call: \(error.localizedDescription)")
            } else {
                print("[CallKit] Full-screen incoming order call reported for order \(orderId)")
            }
            completionHandler()
        }
    }

    // ── CXProviderDelegate: Call Accepted by Vendor ──
    public func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        print("[CallKit] Vendor ACCEPTED incoming order call for order: \(self.currentOrderId ?? "unknown")")
        action.fulfill()

        // Deep link immediately into vendor app order screen
        if let orderId = self.currentOrderId, let url = URL(string: "intrihub-biz://orders?orderId=\(orderId)&autoAccept=true") {
            DispatchQueue.main.async {
                UIApplication.shared.open(url, options: [:], completionHandler: nil)
            }
        }
    }

    // ── CXProviderDelegate: Call Declined / Ended by Vendor ──
    public func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        print("[CallKit] Vendor DECLINED/REJECTED incoming order call for order: \(self.currentOrderId ?? "unknown")")
        action.fulfill()

        if let orderId = self.currentOrderId {
            self.sendOrderRejectToBackend(orderId: orderId, reason: "declined_callkit")
        }
    }

    public func providerDidReset(_ provider: CXProvider) {
        self.activeCallUuid = nil
    }

    // ── Helpers: Forward token & actions to backend ──
    private func sendVoipTokenToBackend(token: String) {
        guard let url = URL(string: "https://intrihub.com/api/mobile/vendor/voip-token") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "voipToken": token,
            "platform": "ios_voip",
            "appVersion": "1.0.15"
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("[PushKit] Failed to sync VoIP token to backend: \(error.localizedDescription)")
            } else {
                print("[PushKit] VoIP token successfully synced to backend.")
            }
        }.resume()
    }

    private func sendOrderRejectToBackend(orderId: String, reason: String) {
        guard let url = URL(string: "https://intrihub.com/api/mobile/vendor/orders/\(orderId)/reject") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "reason": reason,
            "notes": "Declined on iOS CallKit incoming call screen"
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request).resume()
    }
}
