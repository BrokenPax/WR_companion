import AppKit
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

struct SheetJob {
    let pdfPath: String
    let outputDir: String
    let prefix: String
    let ids: [String]
}

let repoRoot = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let tempDir = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("wr-bot-card-sheets", isDirectory: true)

let jobs: [SheetJob] = [
    SheetJob(pdfPath: "assets/bot_Coalition.pdf", outputDir: "assets/cards/bots", prefix: "bot_", ids: ["03", "02", "01", "06", "05", "04", "09", "08", "07"]),
    SheetJob(pdfPath: "assets/bot_KPD.pdf", outputDir: "assets/cards/bots", prefix: "bot_", ids: ["12", "11", "10", "15", "14", "13", "18", "17", "16"]),
    SheetJob(pdfPath: "assets/bot_NSDAP.pdf", outputDir: "assets/cards/bots", prefix: "bot_", ids: ["21", "20", "19", "24", "23", "22", "27", "26", "25"]),
    SheetJob(pdfPath: "assets/bot_RC.pdf", outputDir: "assets/cards/bots", prefix: "bot_", ids: ["30", "29", "28", "33", "32", "31", "36", "35", "34"])
]

func run(_ launchPath: String, _ arguments: [String]) throws {
    let process = Process()
    process.executableURL = URL(fileURLWithPath: launchPath)
    process.arguments = arguments
    try process.run()
    process.waitUntilExit()
    guard process.terminationStatus == 0 else {
        throw NSError(domain: "ExtractBotCards", code: Int(process.terminationStatus), userInfo: [NSLocalizedDescriptionKey: "\(launchPath) failed"])
    }
}

func writeJPEG(_ image: CGImage, to url: URL) throws {
    guard let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else {
        throw NSError(domain: "ExtractBotCards", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not create JPEG destination"])
    }
    CGImageDestinationAddImage(destination, image, [kCGImageDestinationLossyCompressionQuality: 0.86] as CFDictionary)
    if !CGImageDestinationFinalize(destination) {
        throw NSError(domain: "ExtractBotCards", code: 2, userInfo: [NSLocalizedDescriptionKey: "Could not write \(url.path)"])
    }
}

struct Bitmap {
    let width: Int
    let height: Int
    let data: [UInt8]
}

func bitmap(from image: CGImage) throws -> Bitmap {
    let width = image.width
    let height = image.height
    let bytesPerPixel = 4
    let bytesPerRow = width * bytesPerPixel
    var data = [UInt8](repeating: 255, count: height * bytesPerRow)
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let ok = data.withUnsafeMutableBytes { buffer -> Bool in
        guard let context = CGContext(
            data: buffer.baseAddress,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: bytesPerRow,
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { return false }
        context.setFillColor(NSColor.white.cgColor)
        context.fill(CGRect(x: 0, y: 0, width: width, height: height))
        context.interpolationQuality = .high
        context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
        return true
    }
    if !ok {
        throw NSError(domain: "ExtractBotCards", code: 3, userInfo: [NSLocalizedDescriptionKey: "Could not create bitmap"])
    }
    return Bitmap(width: width, height: height, data: data)
}

func pixelOffset(_ bitmap: Bitmap, x: Int, y: Int) -> Int {
    return ((y * bitmap.width) + x) * 4
}

func isContentPixel(_ bitmap: Bitmap, x: Int, y: Int) -> Bool {
    let offset = pixelOffset(bitmap, x: x, y: y)
    let r = Int(bitmap.data[offset])
    let g = Int(bitmap.data[offset + 1])
    let b = Int(bitmap.data[offset + 2])
    let a = Int(bitmap.data[offset + 3])
    if a < 16 { return false }
    let distanceFromWhite = (255 - r) + (255 - g) + (255 - b)
    let saturation = max(r, g, b) - min(r, g, b)
    return distanceFromWhite > 24 || (distanceFromWhite > 14 && saturation > 18)
}

func trimToContent(_ image: CGImage, margin: Int = 4) throws -> CGImage {
    let pixels = try bitmap(from: image)
    var rowCounts = [Int](repeating: 0, count: pixels.height)
    var colCounts = [Int](repeating: 0, count: pixels.width)
    for y in 0..<pixels.height {
        for x in 0..<pixels.width {
            if isContentPixel(pixels, x: x, y: y) {
                rowCounts[y] += 1
                colCounts[x] += 1
            }
        }
    }

    let rowThreshold = max(3, pixels.width / 160)
    let colThreshold = max(3, pixels.height / 160)
    guard let minYRaw = rowCounts.firstIndex(where: { $0 >= rowThreshold }),
          let maxYRaw = rowCounts.lastIndex(where: { $0 >= rowThreshold }),
          let minXRaw = colCounts.firstIndex(where: { $0 >= colThreshold }),
          let maxXRaw = colCounts.lastIndex(where: { $0 >= colThreshold }) else {
        return image
    }

    let minX = max(0, minXRaw - margin)
    let minY = max(0, minYRaw - margin)
    let maxX = min(pixels.width - 1, maxXRaw + margin)
    let maxY = min(pixels.height - 1, maxYRaw + margin)
    let rect = CGRect(x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1)
    return image.cropping(to: rect) ?? image
}

func extract(job: SheetJob) throws {
    let pdfURL = repoRoot.appendingPathComponent(job.pdfPath)
    try FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
    try run("/usr/bin/qlmanage", ["-t", "-s", "2048", "-o", tempDir.path, pdfURL.path])

    let renderedURL = tempDir.appendingPathComponent("\((job.pdfPath as NSString).lastPathComponent).png")
    guard let source = CGImageSourceCreateWithURL(renderedURL as CFURL, nil),
          let sheet = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        throw NSError(domain: "ExtractBotCards", code: 4, userInfo: [NSLocalizedDescriptionKey: "Could not load rendered sheet \(renderedURL.path)"])
    }

    let outputURL = repoRoot.appendingPathComponent(job.outputDir, isDirectory: true)
    try FileManager.default.createDirectory(at: outputURL, withIntermediateDirectories: true)

    let columns = 3
    let rows = 3
    let cellWidth = sheet.width / columns
    let cellHeight = sheet.height / rows

    for index in 0..<min(job.ids.count, columns * rows) {
        let column = index % columns
        let row = index / columns
        let x = column * cellWidth
        let y = row * cellHeight
        let width = column == columns - 1 ? sheet.width - x : cellWidth
        let height = row == rows - 1 ? sheet.height - y : cellHeight
        guard let crop = sheet.cropping(to: CGRect(x: x, y: y, width: width, height: height)) else { continue }
        let finalImage = try trimToContent(crop, margin: 3)
        let output = outputURL.appendingPathComponent("\(job.prefix)\(job.ids[index]).jpg")
        try writeJPEG(finalImage, to: output)
        print("wrote \(output.path)")
    }
}

for job in jobs {
    try extract(job: job)
}
