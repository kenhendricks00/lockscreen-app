import Foundation
import WatchConnectivity

/// The link to the iPhone app. watchOS doesn't let apps keep their own
/// WebSocket open, so the iPhone (which already holds the Pushover connection)
/// relays notifications here.
final class Connectivity: NSObject, WCSessionDelegate {
  static let shared = Connectivity()

  func start() {
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  /// Tells the iPhone a notification was dismissed on the watch.
  func dismiss(id: String) {
    let session = WCSession.default
    guard session.activationState == .activated else { return }
    let payload = ["dismiss": id]
    if session.isReachable {
      session.sendMessage(payload, replyHandler: nil) { _ in _ = session.transferUserInfo(payload) }
    } else {
      _ = session.transferUserInfo(payload)
    }
  }

  private func receive(_ payload: [String: Any]) {
    if let json = payload["state"] as? String { Store.shared.apply(json: json) }
  }

  func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {
    // Catch up on whatever the iPhone sent while the app wasn't running.
    if state == .activated { receive(session.receivedApplicationContext) }
  }

  func session(_ session: WCSession, didReceiveApplicationContext context: [String: Any]) {
    receive(context)
  }

  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    receive(message)
  }

  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
    receive(userInfo)
  }
}
