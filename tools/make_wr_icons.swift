import AppKit
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let repoRoot = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let coverURL = repoRoot.appendingPathComponent("The-Weimar-Republic_cover.png")

guard let cover = NSImage(contentsOf: coverURL),
      let coverImage = cover.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    throw NSError(domain: "MakeWRIcons", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not load \(coverURL.path)"])
}

func writePNG(_ image: CGImage, to url: URL) throws {
    guard let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else {
        throw NSError(domain: "MakeWRIcons", code: 2, userInfo: [NSLocalizedDescriptionKey: "Could not create PNG destination"])
    }
    CGImageDestinationAddImage(destination, image, nil)
    if !CGImageDestinationFinalize(destination) {
        throw NSError(domain: "MakeWRIcons", code: 3, userInfo: [NSLocalizedDescriptionKey: "Could not write \(url.path)"])
    }
}

func makeIcon(size: Int) throws -> CGImage {
    guard let context = CGContext(
        data: nil,
        width: size,
        height: size,
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ) else {
        throw NSError(domain: "MakeWRIcons", code: 4, userInfo: [NSLocalizedDescriptionKey: "Could not create context"])
    }

    let sourceWidth = CGFloat(coverImage.width)
    let sourceHeight = CGFloat(coverImage.height)
    let target = CGFloat(size)
    let scale = max(target / sourceWidth, target / sourceHeight)
    let drawWidth = sourceWidth * scale
    let drawHeight = sourceHeight * scale
    let drawRect = CGRect(
        x: (target - drawWidth) / 2.0,
        y: (target - drawHeight) / 2.0,
        width: drawWidth,
        height: drawHeight
    )

    context.setFillColor(NSColor(calibratedRed: 0.84, green: 0.64, blue: 0.17, alpha: 1).cgColor)
    context.fill(CGRect(x: 0, y: 0, width: target, height: target))
    context.interpolationQuality = .high
    context.draw(coverImage, in: drawRect)

    guard let image = context.makeImage() else {
        throw NSError(domain: "MakeWRIcons", code: 5, userInfo: [NSLocalizedDescriptionKey: "Could not make image"])
    }
    return image
}

for size in [192, 512] {
    let image = try makeIcon(size: size)
    try writePNG(image, to: repoRoot.appendingPathComponent("icon-\(size).png"))
    print("wrote icon-\(size).png from \(coverURL.lastPathComponent)")
}
