import Foundation
#if canImport(UIKit)
import UIKit

func printJSON(_ obj: Any) {
    let data = try! JSONSerialization.data(withJSONObject: obj, options: [.sortedKeys, .prettyPrinted])
    print(String(data: data, encoding: .utf8)!)
}
func hex(_ color: UIColor, _ style: UIUserInterfaceStyle) -> String {
    let resolved = color.resolvedColor(with: UITraitCollection(userInterfaceStyle: style))
    var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
    resolved.getRed(&r, green: &g, blue: &b, alpha: &a)
    func c(_ v: CGFloat) -> Int { max(0, min(255, Int((v * 255).rounded()))) }
    return a < 0.999
        ? String(format: "#%02X%02X%02X%02X", c(r), c(g), c(b), c(a))
        : String(format: "#%02X%02X%02X", c(r), c(g), c(b))
}
func pair(_ color: UIColor) -> [String: String] { ["light": hex(color, .light), "dark": hex(color, .dark)] }

let systemColors: [(String, UIColor)] = [
    ("blue", .systemBlue), ("green", .systemGreen), ("red", .systemRed), ("orange", .systemOrange),
    ("yellow", .systemYellow), ("pink", .systemPink), ("purple", .systemPurple), ("teal", .systemTeal),
    ("indigo", .systemIndigo), ("brown", .systemBrown), ("mint", .systemMint), ("cyan", .systemCyan),
    ("gray", .systemGray), ("gray2", .systemGray2), ("gray3", .systemGray3),
    ("gray4", .systemGray4), ("gray5", .systemGray5), ("gray6", .systemGray6),
]
let semanticColors: [(String, UIColor)] = [
    ("label", .label), ("secondaryLabel", .secondaryLabel), ("tertiaryLabel", .tertiaryLabel),
    ("quaternaryLabel", .quaternaryLabel), ("placeholderText", .placeholderText),
    ("separator", .separator), ("opaqueSeparator", .opaqueSeparator), ("link", .link),
    ("systemBackground", .systemBackground), ("secondarySystemBackground", .secondarySystemBackground),
    ("tertiarySystemBackground", .tertiarySystemBackground),
    ("systemGroupedBackground", .systemGroupedBackground),
    ("secondarySystemGroupedBackground", .secondarySystemGroupedBackground),
    ("tertiarySystemGroupedBackground", .tertiarySystemGroupedBackground),
]
let textStyles: [(String, UIFont.TextStyle)] = [
    ("largeTitle", .largeTitle), ("title1", .title1), ("title2", .title2), ("title3", .title3),
    ("headline", .headline), ("body", .body), ("callout", .callout),
    ("subheadline", .subheadline), ("footnote", .footnote), ("caption1", .caption1), ("caption2", .caption2),
]

let args = CommandLine.arguments
if args.count > 1, args[1] == "--check" {
    var result: [String: Bool] = [:]
    for name in args.dropFirst(2) { result[name] = UIImage(systemName: name) != nil }
    printJSON(["validate": result]); exit(0)
}

var sys: [String: [String: String]] = [:]
for (k, v) in systemColors { sys[k] = pair(v) }
var sem: [String: [String: String]] = [:]
for (k, v) in semanticColors { sem[k] = pair(v) }
func weightName(_ font: UIFont) -> String {
    let traits = font.fontDescriptor.object(forKey: .traits) as? [UIFontDescriptor.TraitKey: Any]
    let w = (traits?[.weight] as? CGFloat) ?? 0
    let scale: [(String, CGFloat)] = [
        ("Ultralight", -0.8), ("Thin", -0.6), ("Light", -0.4), ("Regular", 0.0),
        ("Medium", 0.23), ("Semibold", 0.3), ("Bold", 0.4), ("Heavy", 0.56), ("Black", 0.62)
    ]
    return scale.min(by: { abs($0.1 - w) < abs($1.1 - w) })!.0
}
var ramp: [String: [String: Any]] = [:]
for (name, style) in textStyles {
    let f = UIFont.preferredFont(forTextStyle: style)
    ramp[name] = ["size": f.pointSize, "leading": f.lineHeight.rounded(), "weight": weightName(f)]
}
printJSON(["colors": ["system": sys, "semantic": sem], "typeRamp": ramp])
#else
FileHandle.standardError.write("probe: UIKit unavailable — build with a Mac Catalyst target (-target <arch>-apple-ios<ver>-macabi)\n".data(using: .utf8)!)
exit(1)
#endif
