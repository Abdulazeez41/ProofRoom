export interface ParsedDocumentPage {
  pageNumber: number;
  text: string;
}

export interface ParsedDocument {
  documentId: string;
  name: string;
  pages: ParsedDocumentPage[];
  totalCharacters: number;
}

/**
 * Extracts readable text from an ArrayBuffer or string in the browser.
 * Supports plain text, markdown, and structured documents.
 */
export async function parseDocumentContent(
  documentId: string,
  name: string,
  content: Uint8Array | string
): Promise<ParsedDocument> {
  let rawText = "";

  if (typeof content === "string") {
    rawText = content;
  } else {
    try {
      rawText = new TextDecoder("utf-8").decode(content);
    } catch {
      rawText = "[Binary or unparseable text format]";
    }
  }

  // Split into simulated pages (by form feed \f or every ~2500 characters)
  const pages: ParsedDocumentPage[] = [];
  const rawPages = rawText.split(/\f|\n(?=Page\s+\d+)/i);

  if (rawPages.length > 1) {
    rawPages.forEach((p, idx) => {
      const clean = p.trim();
      if (clean.length > 0) {
        pages.push({ pageNumber: idx + 1, text: clean });
      }
    });
  } else {
    // Break into logical pages of approx 2000 chars by paragraph
    const paragraphs = rawText.split(/\n\s*\n/);
    let currentPage = 1;
    let currentText = "";

    for (const para of paragraphs) {
      if (currentText.length + para.length > 2000 && currentText.length > 0) {
        pages.push({ pageNumber: currentPage++, text: currentText.trim() });
        currentText = para + "\n\n";
      } else {
        currentText += para + "\n\n";
      }
    }

    if (currentText.trim().length > 0) {
      pages.push({ pageNumber: currentPage, text: currentText.trim() });
    }
  }

  if (pages.length === 0) {
    pages.push({ pageNumber: 1, text: rawText.trim() || "[Empty Document]" });
  }

  return {
    documentId,
    name,
    pages,
    totalCharacters: rawText.length,
  };
}
