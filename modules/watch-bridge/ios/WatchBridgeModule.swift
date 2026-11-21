import ExpoModulesCore
import WatchConnectivity

/// Sends the lock screen's notifications to the Apple Watch app, and reports
/// notifications dismissed on the watch back to JS as `onDismiss`.
public class WatchBridgeModule: Module {
  private let relay = WatchRelay()

  public func definition() -> ModuleDefinition {
    Name("WatchBridge")

    Events("onDismiss")

    OnCreate {
      self.relay.onDismiss = { [weak self] id in
        self?.sendEvent("onDismiss", ["id": id])
      }
      self.relay.start()
    }

    /// `json` is the whole watch state. `complication` asks for an immediate
    /// complication refresh, which iOS budgets (about 50 a day), so JS only
    /// sets it when a new notification arrives.
    Function("send") { (json: String, complication: Bool) in
      self.relay.send(json, complication: complication)
    }
  }
}

final class WatchRelay: NSObject, WCSessionDelegate {
  var onDismiss: ((String) -> Void)?
  private var pending: (json: String, complication: Bool)?

  func start() {
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  func send(_ json: String, complication: Bool) {
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    guard session.activationState == .activated else {
      pending = (json, complication || (pending?.complication ?? false))
      return
    }
    guard session.isPaired, session.isWatchAppInstalled else { return }

    let payload: [String: Any] = ["state": json]
    // The latest state always waits for the watch, even if it's asleep.
    try? session.updateApplicationContext(payload)
    if session.isReachable {
      session.sendMessage(payload, replyHandler: nil, errorHandler: nil)
    } else if complication && session.isComplicationEnabled {
      // Wakes the watch app in the background to refresh the complication.
      _ = session.transferCurrentComplicationUserInfo(payload)
    }
  }

  private func receive(_ payload: [String: Any]) {
    if let id = payload["dismiss"] as? String { onDismiss?(id) }
  }

  func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {
    guard state == .activated, let waiting = pending else { return }
    pending = nil
    send(waiting.json, complication: waiting.complication)
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  // After switching to another watch, start again with the new one.
  func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
  }

  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    receive(message)
  }

  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
    receive(userInfo)
  }
}
