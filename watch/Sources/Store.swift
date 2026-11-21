import ClockKit
import Foundation
import WatchKit

/// One notification, as the iPhone sends it.
struct WatchNote: Codable, Identifiable, Equatable {
  let id: String
  let title: String
  let message: String
  let date: Double // unix seconds
}

/// Everything the iPhone sends: the newest notifications plus the watch settings.
struct WatchState: Codable, Equatable {
  var notes: [WatchNote] = []
  var screen: String = "normal" // "normal" or "off" (looks switched off)
  var complication: String = "title" // "title", "count" or "dot"
  var glow: Double = 0.5 // text opacity on the "off" screen
  var hideText: Bool = false // titles only until tapped
  var haptic: Bool = true // tap the wrist when one arrives while the app is open
}

/// The latest state from the iPhone, kept in UserDefaults so the watch app and
/// its complication still have it after a restart.
final class Store: ObservableObject {
  static let shared = Store()
  private static let key = "state"

  @Published private(set) var state: WatchState

  private init() {
    if let data = UserDefaults.standard.data(forKey: Store.key),
       let saved = try? JSONDecoder().decode(WatchState.self, from: data) {
      state = saved
    } else {
      state = WatchState()
    }
  }

  /// Applies a state JSON string from the iPhone.
  func apply(json: String) {
    guard let data = json.data(using: .utf8),
          let next = try? JSONDecoder().decode(WatchState.self, from: data) else { return }
    UserDefaults.standard.set(data, forKey: Store.key)
    DispatchQueue.main.async {
      let known = Set(self.state.notes.map(\.id))
      let arrived = next.notes.contains { !known.contains($0.id) }
      self.state = next
      if arrived && next.haptic && WKExtension.shared().applicationState == .active {
        WKInterfaceDevice.current().play(.notification)
      }
      Store.reloadComplications()
    }
  }

  /// Removes a notification here and asks the iPhone to dismiss it too.
  func dismiss(_ note: WatchNote) {
    var next = state
    next.notes.removeAll { $0.id == note.id }
    state = next
    if let data = try? JSONEncoder().encode(next) {
      UserDefaults.standard.set(data, forKey: Store.key)
    }
    Connectivity.shared.dismiss(id: note.id)
    Store.reloadComplications()
  }

  static func reloadComplications() {
    let server = CLKComplicationServer.sharedInstance()
    server.activeComplications?.forEach { server.reloadTimeline(for: $0) }
  }
}
