import AppKit
import Foundation
import PDFKit

guard CommandLine.arguments.count >= 4 else {
    fputs("usage: swift tools/render_pdf_pages.swift <pdf> <outdir> <page> [page...]\n", stderr)
    exit(1)
}

let pdfURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outdir = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
try FileManager.default.createDirectory(at: outdir, withIntermediateDirectories: true)

guard let document = PDFDocument(url: pdfURL) else {
    fputs("could not open \(pdfURL.path)\n", stderr)
    exit(1)
}

for rawPage in CommandLine.arguments.dropFirst(3) {
    guard let pageNumber = Int(rawPage), pageNumber >= 1, pageNumber <= document.pageCount else {
        fputs("skipping invalid page \(rawPage)\n", stderr)
        continue
    }
    guard let page = document.page(at: pageNumber - 1) else { continue }
    let bounds = page.bounds(for: .mediaBox)
    let scale: CGFloat = 3.0
    let size = NSSize(width: bounds.width * scale, height: bounds.height * scale)
    let image = NSImage(size: size)

    image.lockFocus()
    NSColor.white.setFill()
    NSRect(origin: .zero, size: size).fill()
    guard let context = NSGraphicsContext.current?.cgContext else {
        image.unlockFocus()
        continue
    }
    context.saveGState()
    context.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: context)
    context.restoreGState()
    image.unlockFocus()

    guard let tiff = image.tiffRepresentation,
          let rep = NSBitmapImageRep(data: tiff),
          let png = rep.representation(using: .png, properties: [:]) else {
        fputs("could not encode page \(pageNumber)\n", stderr)
        continue
    }

    let outputURL = outdir.appendingPathComponent(String(format: "page_%02d.png", pageNumber))
    try png.write(to: outputURL)
    print(outputURL.path)
}
