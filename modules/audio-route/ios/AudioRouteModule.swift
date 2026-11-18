import AVFoundation
import ExpoModulesCore

public class AudioRouteModule: Module {
  // Wired headphones and Bluetooth audio. CarPlay reports as .carAudio, so it's
  // left out; a plain Bluetooth car stereo looks the same as headphones to iOS.
  private static let headphonePorts: Set<AVAudioSession.Port> = [
    .headphones, .bluetoothA2DP, .bluetoothLE, .bluetoothHFP,
  ]

  public func definition() -> ModuleDefinition {
    Name("AudioRoute")

    Function("isHeadphonesConnected") { () -> Bool in
      AVAudioSession.sharedInstance().currentRoute.outputs.contains {
        Self.headphonePorts.contains($0.portType)
      }
    }
  }
}
