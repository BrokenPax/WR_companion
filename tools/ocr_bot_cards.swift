import AppKit
import Vision

let repoRoot = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let cardsDir = repoRoot.appendingPathComponent("assets/cards/bots", isDirectory: true)
let files = try FileManager.default.contentsOfDirectory(at: cardsDir, includingPropertiesForKeys: nil)
    .filter { $0.pathExtension.lowercased() == "jpg" }
    .sorted { $0.lastPathComponent < $1.lastPathComponent }

for file in files {
    guard let image = NSImage(contentsOf: file),
          let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        continue
    }

    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.minimumTextHeight = 0.02
    request.recognitionLanguages = ["en-US"]

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try handler.perform([request])
    let observations = request.results ?? []
    let lines = observations.compactMap { $0.topCandidates(1).first?.string }

    print("===== \(file.deletingPathExtension().lastPathComponent) =====")
    for line in lines {
        print(line)
    }
}
