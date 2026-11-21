import ClockKit

/// The watch-face complication. watchOS 8 uses ClockKit (WidgetKit
/// complications need watchOS 9). What it shows depends on the iPhone's
/// "Complication shows" setting:
///   title - the newest notification's title (and message on large faces)
///   count - how many are waiting
///   dot   - a dot when anything is waiting, nothing otherwise
@objc(ComplicationController)
final class ComplicationController: NSObject, CLKComplicationDataSource {
  private static let families: [CLKComplicationFamily] = [
    .modularSmall, .modularLarge, .utilitarianSmall, .utilitarianSmallFlat, .utilitarianLarge,
    .circularSmall, .extraLarge, .graphicCorner, .graphicCircular, .graphicRectangular,
  ]

  func getComplicationDescriptors(handler: @escaping ([CLKComplicationDescriptor]) -> Void) {
    handler([
      CLKComplicationDescriptor(
        identifier: "notifications", displayName: "Lock Screen", supportedFamilies: Self.families),
    ])
  }

  func getCurrentTimelineEntry(
    for complication: CLKComplication,
    withHandler handler: @escaping (CLKComplicationTimelineEntry?) -> Void
  ) {
    let template = Self.template(for: complication.family, texts: Texts(state: Store.shared.state))
    handler(template.map { CLKComplicationTimelineEntry(date: Date(), complicationTemplate: $0) })
  }

  func getLocalizableSampleTemplate(
    for complication: CLKComplication,
    withHandler handler: @escaping (CLKComplicationTemplate?) -> Void
  ) {
    handler(Self.template(for: complication.family, texts: Texts(short: "2", title: "Front door", body: "Package delivered")))
  }

  // Hidden while the watch is locked (off the wrist).
  func getPrivacyBehavior(
    for complication: CLKComplication,
    withHandler handler: @escaping (CLKComplicationPrivacyBehavior) -> Void
  ) {
    handler(.hideOnLockScreen)
  }

  /// The three strings every template is built from.
  struct Texts {
    var short: String // small faces
    var title: String
    var body: String

    init(short: String, title: String, body: String) {
      self.short = short
      self.title = title
      self.body = body
    }

    init(state: WatchState) {
      let count = state.notes.count
      guard let newest = state.notes.first else {
        self.init(short: "", title: "", body: "")
        return
      }
      switch state.complication {
      case "count":
        self.init(short: "\(count)", title: "\(count) new", body: "")
      case "dot":
        self.init(short: "•", title: "•", body: "")
      default:
        self.init(
          short: String(newest.title.prefix(4)),
          title: newest.title,
          body: state.hideText ? (count > 1 ? "+\(count - 1) more" : "") : newest.message)
      }
    }
  }

  private static func template(for family: CLKComplicationFamily, texts: Texts) -> CLKComplicationTemplate? {
    let short = CLKSimpleTextProvider(text: texts.short)
    let title = CLKSimpleTextProvider(text: texts.title)
    let body = CLKSimpleTextProvider(text: texts.body)
    switch family {
    case .modularSmall:
      return CLKComplicationTemplateModularSmallSimpleText(textProvider: short)
    case .modularLarge:
      return CLKComplicationTemplateModularLargeStandardBody(headerTextProvider: title, body1TextProvider: body)
    case .utilitarianSmall, .utilitarianSmallFlat:
      return CLKComplicationTemplateUtilitarianSmallFlat(textProvider: short)
    case .utilitarianLarge:
      return CLKComplicationTemplateUtilitarianLargeFlat(textProvider: title)
    case .circularSmall:
      return CLKComplicationTemplateCircularSmallSimpleText(textProvider: short)
    case .extraLarge:
      return CLKComplicationTemplateExtraLargeSimpleText(textProvider: short)
    case .graphicCorner:
      return CLKComplicationTemplateGraphicCornerStackText(innerTextProvider: body, outerTextProvider: title)
    case .graphicCircular:
      return CLKComplicationTemplateGraphicCircularStackText(line1TextProvider: short, line2TextProvider: CLKSimpleTextProvider(text: ""))
    case .graphicRectangular:
      return CLKComplicationTemplateGraphicRectangularStandardBody(headerTextProvider: title, body1TextProvider: body)
    default:
      return nil
    }
  }
}
