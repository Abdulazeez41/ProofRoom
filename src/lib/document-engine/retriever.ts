import { ParsedDocument } from "./parser";

export interface DocumentChunk {
  chunkId: string;
  documentId: string;
  documentName: string;
  pageNumber: number;
  text: string;
  score?: number;
}

export interface RetrievalResult {
  chunks: DocumentChunk[];
  contextPrompt: string;
}

/**
 * Chunks parsed documents into searchable passages with page awareness.
 */
export function chunkDocuments(
  documents: ParsedDocument[],
  maxChunkSize = 800,
  overlap = 150
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let chunkCounter = 1;

  for (const doc of documents) {
    for (const page of doc.pages) {
      const text = page.text.trim();
      if (!text) continue;

      if (text.length <= maxChunkSize) {
        chunks.push({
          chunkId: `chk-${chunkCounter++}`,
          documentId: doc.documentId,
          documentName: doc.name,
          pageNumber: page.pageNumber,
          text,
        });
        continue;
      }

      // Sliding window over page paragraphs
      let start = 0;
      while (start < text.length) {
        let end = Math.min(start + maxChunkSize, text.length);

        // Try breaking at paragraph or sentence boundary
        if (end < text.length) {
          const nextNewline = text.lastIndexOf("\n", end);
          const nextPeriod = text.lastIndexOf(". ", end);
          if (nextNewline > start + maxChunkSize / 2) {
            end = nextNewline;
          } else if (nextPeriod > start + maxChunkSize / 2) {
            end = nextPeriod + 1;
          }
        }

        const chunkText = text.substring(start, end).trim();
        if (chunkText.length > 20) {
          chunks.push({
            chunkId: `chk-${chunkCounter++}`,
            documentId: doc.documentId,
            documentName: doc.name,
            pageNumber: page.pageNumber,
            text: chunkText,
          });
        }

        if (end >= text.length) break;
        start = Math.max(start + 1, end - overlap);
      }
    }
  }

  return chunks;
}

/**
 * Scores and retrieves top relevant passages for a question.
 */
export function retrieveRelevantPassages(
  question: string,
  chunks: DocumentChunk[],
  topK = 5
): RetrievalResult {
  const queryTokens = question
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const scoredChunks = chunks.map((chunk) => {
    const chunkLower = chunk.text.toLowerCase();
    let score = 0;

    for (const token of queryTokens) {
      const occurrences = chunkLower.split(token).length - 1;
      if (occurrences > 0) {
        score += occurrences * (token.length > 4 ? 3 : 1);
      }
    }

    // Exact phrase match bonus
    if (chunkLower.includes(question.toLowerCase())) {
      score += 20;
    }

    return { ...chunk, score };
  });

  // Sort descending by relevance score
  scoredChunks.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Select top K chunks with positive score, or fallback to first few if general summary
  let topChunks = scoredChunks.filter((c) => (c.score || 0) > 0).slice(0, topK);
  if (topChunks.length === 0) {
    topChunks = scoredChunks.slice(0, Math.min(3, scoredChunks.length));
  }

  // Format context for prompt
  const contextLines = topChunks.map((chunk, idx) => {
    return `[Source ${idx + 1}: ${chunk.documentName} | Page ${chunk.pageNumber}]\n${chunk.text}`;
  });

  const contextPrompt = contextLines.join("\n\n---\n\n");

  return {
    chunks: topChunks,
    contextPrompt,
  };
}

/**
 * Constructs the private AI system and user messages following ProofRoom's security requirements.
 */
export function buildPromptMessages(
  question: string,
  contextPrompt: string
): { role: "system" | "user"; content: string }[] {
  const systemPrompt = `You are ProofRoom Private AI, a confidential due-diligence document intelligence assistant running inside an attested Intel TDX hardware enclave.

CRITICAL INSTRUCTIONS:
1. Base your answer STRICTLY and EXCLUSIVELY on the provided source excerpts below.
2. For each material fact, cite the source document name and page number using format: [Document Name, Page X].
3. Clearly distinguish:
   - "Direct Fact": Explicitly stated in the provided documents.
   - "Interpretation": Reasonable inferences supported by the text.
   - "Unverified / Missing": Critical information requested that is not present in the excerpts.
4. If the provided excerpts do not contain enough information to answer a question or financial metric, explicitly state: "The available authorized documents do not contain information regarding [topic]." Do NOT fabricate revenue figures, legal clauses, or dates.
5. For legal, change-of-control, or contractual clauses, clarify that this analysis is informational review and does not constitute formal legal counsel.`;

  const userContent = `AUTHORIZED DOCUMENT EXCERPTS:
${contextPrompt}

QUESTION:
${question}

Please provide a precise, structured answer with explicit document citations:`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];
}
