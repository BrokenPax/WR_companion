import AppKit
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let repoRoot = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)

func writePNG(_ image: CGImage, to url: URL) throws {
    guard let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else {
        throw NSError(domain: "MakeWRIcons", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not create PNG destination"])
    }
    CGImageDestinationAddImage(destination, image, nil)
    if !CGImageDestinationFinalize(destination) {
        throw NSError(domain: "MakeWRIcons", code: 2, userInfo: [NSLocalizedDescriptionKey: "Could not write \(url.path)"])
    }
}

func makeIcon(size: Int) throws -> CGImage {
    let scale = CGFloat(size)
    guard let context = CGContext(
        data: nil,
        width: size,
        height: size,
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ) else {
        throw NSError(domain: "MakeWRIcons", code: 3, userInfo: [NSLocalizedDescriptionKey: "Could not create context"])
    }

    func rect(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat) -> CGRect {
        CGRect(x: x * scale, y: y * scale, width: w * scale, height: h * scale)
    }

    context.setFillColor(NSColor(calibratedRed: 0.965, green: 0.941, blue: 0.886, alpha: 1).cgColor)
    context.fill(rect(0, 0, 1, 1))

    let corner = CGFloat(size) * 0.2
    let path = CGPath(roundedRect: rect(0.08, 0.08, 0.84, 0.84), cornerWidth: corner, cornerHeight: corner, transform: nil)
    context.addPath(path)
    context.clip()

    context.setFillColor(NSColor(calibratedRed: 0.98, green: 0.953, blue: 0.898, alpha: 1).cgColor)
    context.fill(rect(0.08, 0.08, 0.84, 0.84))

    let stripeHeight: CGFloat = 0.16
    let stripeY: CGFloat = 0.08
    let stripeWidth: CGFloat = 0.28
    let colors = [
        NSColor(calibratedRed: 0.12, green: 0.12, blue: 0.13, alpha: 1).cgColor,
        NSColor(calibratedRed: 0.63, green: 0.18, blue: 0.18, alpha: 1).cgColor,
        NSColor(calibratedRed: 0.85, green: 0.65, blue: 0.25, alpha: 1).cgColor
    ]
    for index in 0..<3 {
        context.setFillColor(colors[index])
        context.fill(rect(0.08 + CGFloat(index) * stripeWidth, stripeY, stripeWidth, stripeHeight))
    }

    context.setStrokeColor(NSColor(calibratedRed: 0.114, green: 0.129, blue: 0.227, alpha: 1).cgColor)
    context.setLineWidth(CGFloat(size) * 0.045)
    context.stroke(rect(0.08, 0.08, 0.84, 0.84))

    let fontSize = CGFloat(size) * 0.29
    let attrs: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: fontSize, weight: .heavy),
        .foregroundColor: NSColor(calibratedRed: 0.114, green: 0.129, blue: 0.227, alpha: 1)
    ]
    let text = NSAttributedString(string: "WR", attributes: attrs)
    let textSize = text.size()
    let textRect = CGRect(
        x: (CGFloat(size) - textSize.width) / 2.0,
        y: CGFloat(size) * 0.42,
        width: textSize.width,
        height: textSize.height
    )
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: false)
    text.draw(in: textRect)
    NSGraphicsContext.restoreGraphicsState()

    guard let image = context.makeImage() else {
        throw NSError(domain: "MakeWRIcons", code: 4, userInfo: [NSLocalizedDescriptionKey: "Could not make image"])
    }
    return image
}

for size in [192, 512] {
    let image = try makeIcon(size: size)
    try writePNG(image, to: repoRoot.appendingPathComponent("icon-\(size).png"))
    print("wrote icon-\(size).png")
}
