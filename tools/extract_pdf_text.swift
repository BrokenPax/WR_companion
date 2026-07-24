import Foundation
import PDFKit

guard CommandLine.arguments.count > 1 else {
    fputs("usage: swift tools/extract_pdf_text.swift <pdf>\n", stderr)
    exit(1)
}

let url = URL(fileURLWithPath: CommandLine.arguments[1])
guard let document = PDFDocument(url: url) else {
    fputs("could not open \(url.path)\n", stderr)
    exit(1)
}

for index in 0..<document.pageCount {
    print("===== PAGE \(index + 1) =====")
    print(document.page(at: index)?.string ?? "")
}
