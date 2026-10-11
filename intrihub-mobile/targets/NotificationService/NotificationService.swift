import UserNotifications

class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

        guard let bestAttemptContent = bestAttemptContent else {
            contentHandler(request.content)
            return
        }

        // 1. Extract image URL from either top-level or data payload
        let userInfo = request.content.userInfo
        var imageString: String? = nil

        if let img = userInfo["image"] as? String, !img.isEmpty {
            imageString = img
        } else if let img = userInfo["imageUrl"] as? String, !img.isEmpty {
            imageString = img
        } else if let body = userInfo["body"] as? [String: Any], let img = body["image"] as? String, !img.isEmpty {
            imageString = img
        } else if let data = userInfo["data"] as? [String: Any] {
            if let img = data["imageUrl"] as? String, !img.isEmpty {
                imageString = img
            } else if let img = data["image"] as? String, !img.isEmpty {
                imageString = img
            }
        }

        guard let urlString = imageString, let url = URL(string: urlString) else {
            // No image present or invalid URL: deliver text content immediately
            contentHandler(bestAttemptContent)
            return
        }

        // 2. Download the media file into a local temporary container with file extension
        let session = URLSession(configuration: .default)
        let downloadTask = session.downloadTask(with: url) { [weak self] (location, response, error) in
            guard let location = location, error == nil else {
                contentHandler(bestAttemptContent)
                return
            }

            // Determine file extension (.jpg, .png, .webp)
            var ext = url.pathExtension
            if ext.isEmpty {
                if let mime = response?.mimeType {
                    if mime.contains("png") { ext = "png" }
                    else if mime.contains("webp") { ext = "webp" }
                    else { ext = "jpg" }
                } else {
                    ext = "jpg"
                }
            }

            let tempDir = URL(fileURLWithPath: NSTemporaryDirectory())
            let uniqueFilename = ProcessInfo.processInfo.globallyUniqueString + "." + ext
            let localUrl = tempDir.appendingPathComponent(uniqueFilename)

            do {
                if FileManager.default.fileExists(atPath: localUrl.path) {
                    try FileManager.default.removeItem(at: localUrl)
                }
                try FileManager.default.moveItem(at: location, to: localUrl)
                let attachment = try UNNotificationAttachment(identifier: "rich_banner", url: localUrl, options: nil)
                bestAttemptContent.attachments = [attachment]
            } catch {
                print("[NotificationServiceExtension] Error attaching image: \(error.localizedDescription)")
            }

            contentHandler(bestAttemptContent)
        }
        downloadTask.resume()
    }

    override func serviceExtensionTimeWillExpire() {
        // Called just before extension expires (approx 30s limit): deliver best attempt content
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }
}
