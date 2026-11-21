import SwiftUI

@main
struct LockScreenWatchApp: App {
  @StateObject private var store = Store.shared

  init() {
    Connectivity.shared.start()
  }

  var body: some Scene {
    WindowGroup {
      ContentView().environmentObject(store)
    }
  }
}

/// The "looks off" screen when that's chosen, otherwise the notification list.
/// A double tap on the black screen shows the list until the wrist goes down.
struct ContentView: View {
  @EnvironmentObject private var store: Store
  @Environment(\.scenePhase) private var scenePhase
  @State private var awake = false

  var body: some View {
    Group {
      if store.state.screen == "off" && !awake {
        OffView(state: store.state)
          .onTapGesture(count: 2) { awake = true }
      } else {
        NoteListView()
      }
    }
    .onChange(of: scenePhase) { phase in
      if phase != .active { awake = false }
    }
  }
}

/// Pure black, so the watch's OLED pixels are off and it looks asleep. The
/// newest notification shows faintly; with nothing waiting it's fully black.
struct OffView: View {
  let state: WatchState
  @State private var peeking = false

  var body: some View {
    ZStack {
      Color.black.ignoresSafeArea()
      if let note = state.notes.first {
        VStack(spacing: 4) {
          Text(note.title + (state.notes.count > 1 ? "  +\(state.notes.count - 1)" : ""))
            .font(.system(size: 19, weight: .bold))
            .lineLimit(2)
          if !state.hideText || peeking {
            Text(note.message)
              .font(.system(size: 16, weight: .semibold))
              .lineLimit(4)
          }
        }
        .multilineTextAlignment(.center)
        .foregroundColor(Color(red: 1, green: 0.96, blue: 0.9).opacity(state.glow))
        .padding(.horizontal, 6)
        // A single tap peeks at a hidden message; a double tap wakes the list.
        .onTapGesture { peeking.toggle() }
      }
    }
  }
}

/// Every notification, newest first. Tap to show a hidden message, swipe to dismiss.
struct NoteListView: View {
  @EnvironmentObject private var store: Store
  @State private var revealed = Set<String>()

  var body: some View {
    if store.state.notes.isEmpty {
      Text("No notifications")
        .foregroundColor(.gray)
    } else {
      List {
        ForEach(store.state.notes) { note in
          VStack(alignment: .leading, spacing: 2) {
            Text(note.title).font(.headline).lineLimit(2)
            if !store.state.hideText || revealed.contains(note.id) {
              Text(note.message).font(.body).foregroundColor(.gray)
            }
          }
          .onTapGesture {
            if revealed.contains(note.id) { revealed.remove(note.id) } else { revealed.insert(note.id) }
          }
        }
        .onDelete { offsets in
          offsets.map { store.state.notes[$0] }.forEach(store.dismiss)
        }
      }
    }
  }
}
