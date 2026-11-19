import ExpoModulesCore
import ObjectiveC
import UIKit

/// iOS only hides the home indicator when the on-screen view controller's
/// `prefersHomeIndicatorAutoHidden` says so, and React Native's root view
/// controller always says no. This overrides that getter on the root view
/// controller's class so the app can switch it at runtime. Even then iOS only
/// hides the bar a few seconds after the last touch.
private enum HomeIndicatorState {
  static var hidden = false
  static var patched = Set<ObjectIdentifier>()

  static func patch(_ cls: AnyClass) {
    let id = ObjectIdentifier(cls)
    guard !patched.contains(id) else { return }
    patched.insert(id)

    let selector = #selector(getter: UIViewController.prefersHomeIndicatorAutoHidden)
    let block: @convention(block) (UIViewController) -> Bool = { _ in HomeIndicatorState.hidden }
    let imp = imp_implementationWithBlock(block)
    // Add an override on this class; if it already has its own, replace it.
    if !class_addMethod(cls, selector, imp, "B@:"), let method = class_getInstanceMethod(cls, selector) {
      method_setImplementation(method, imp)
    }
  }
}

public class HomeIndicatorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("HomeIndicator")

    Function("setAutoHidden") { (hidden: Bool) in
      DispatchQueue.main.async {
        HomeIndicatorState.hidden = hidden
        let root = UIApplication.shared.connectedScenes
          .compactMap { $0 as? UIWindowScene }
          .flatMap { $0.windows }
          .first { $0.isKeyWindow }?
          .rootViewController
        guard let root else { return }
        HomeIndicatorState.patch(type(of: root))
        root.setNeedsUpdateOfHomeIndicatorAutoHidden()
      }
    }
  }
}
