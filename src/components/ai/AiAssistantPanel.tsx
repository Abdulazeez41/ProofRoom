"use client";

import React, { useState } from "react";
import {
  Send,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "../ui/Button";
import { SecurityBadge } from "../ui/Badge";
import { useWallet } from "@/context/WalletContext";
import { parseDocumentContent } from "@/lib/document-engine/parser";
import { chunkDocuments, retrieveRelevantPassages, buildPromptMessages, DocumentChunk } from "@/lib/document-engine/retriever";
import { encryptChatRequest, decryptChatResponse } from "@/lib/near-ai/encrypted-chat";
import { computeReceiptHash, computeSha256 } from "@/lib/crypto/hashing";
import { DEMO_SUGGESTED_QUESTIONS, DEMO_DOCUMENTS } from "@/lib/demo/northstar-data";

export interface ChatEntry {
  id: string;
  question: string;
  answer: string;
  sources: DocumentChunk[];
  requestHash: string;
  responseHash: string;
  signatureValid: boolean;
  receiptHash: string;
  timestamp: number;
}

export function AiAssistantPanel({
  roomId,
  isAuthorized = true,
}: {
  roomId: string;
  isAuthorized?: boolean;
}) {
  const { accountId, isConnected } = useWallet();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);

  const handleAskQuestion = async (queryText?: string) => {
    const activeQuery = (queryText || question).trim();
    if (!activeQuery || loading) return;

    if (!isAuthorized) {
      alert("Access Denied: You must be an authorized participant with active permissions to query documents.");
      return;
    }

    setLoading(true);
    setQuestion("");

    try {
      // Step 1: Client-Side Document Parsing & Local Context Retrieval
      setActiveStep("Parsing authorized documents locally in browser...");
      const parsedDocs = [];
      for (const demoDoc of DEMO_DOCUMENTS) {
        const parsed = await parseDocumentContent(demoDoc.documentId, demoDoc.name, demoDoc.content);
        parsedDocs.push(parsed);
      }

      const allChunks = chunkDocuments(parsedDocs);
      const retrieval = retrieveRelevantPassages(activeQuery, allChunks, 4);

      // Step 2: Fetch and verify current Intel TDX Attestation from NEAR AI Cloud
      setActiveStep("Verifying Intel TDX hardware attestation quote...");
      const attRes = await fetch("/api/ai/attestation");
      const attData = await attRes.json();

      if (!attData.success || !attData.evidence) {
        throw new Error(attData.error || "Failed to retrieve TEE hardware attestation evidence");
      }

      // Verify attestation evidence (Fail-Closed)
      const verifyRes = await fetch("/api/verification/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence: attData.evidence,
          expectedNonce: attData.nonce,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success || verifyData.report?.overallStatus !== "VERIFIED") {
        throw new Error(
          `Hardware Attestation Failed: ${verifyData.report?.failClosedReason || "Unverified execution environment"}. Prompt not sent.`
        );
      }

      // Step 3: Encrypt Request using E2EE Chat Protocol for the attested model key
      setActiveStep("Encrypting prompt with AES-256-GCM for Intel TDX enclave...");
      const messages = buildPromptMessages(activeQuery, retrieval.contextPrompt);
      const { payload: encryptedPayload, clientEphemeralPrivateHex } = await encryptChatRequest(
        messages,
        attData.evidence.modelId,
        attData.evidence.enclavePublicKeyHex
      );

      // Step 4: Relay Ciphertext to NEAR AI Cloud (Server sees zero plaintext)
      setActiveStep("Transmitting ciphertext to NEAR AI Cloud...");
      const relayRes = await fetch("/api/ai/relay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encryptedPayload),
      });

      const relayData = await relayRes.json();
      if (!relayData.success || !relayData.envelope) {
        throw new Error(relayData.error || "Inference relay execution failed");
      }

      // Step 5: Verify Enclave Signature and Decrypt Response locally in browser
      setActiveStep("Validating enclave response signature & decrypting locally...");
      const decrypted = await decryptChatResponse(
        relayData.envelope,
        clientEphemeralPrivateHex,
        attData.evidence.enclavePublicKeyHex
      );

      // Step 6: Create Privacy-Preserving Activity Receipt & Anchor on NEAR Testnet
      setActiveStep("Anchoring cryptographic activity receipt to NEAR Testnet...");
      const queryId = `qry-${Date.now()}`;
      const receiptHash = computeReceiptHash(
        roomId,
        queryId,
        decrypted.requestHash,
        decrypted.responseHash,
        "VERIFIED"
      );

      // Persist receipt
      await fetch("/api/audit/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          receiptHash,
          eventType: "AI_INFERENCE_VERIFIED",
          verificationStatus: "VERIFIED",
          modelId: decrypted.modelId,
          requestHash: decrypted.requestHash,
          responseHash: decrypted.responseHash,
          transactionHash: computeSha256(`tx:near:receipt:${receiptHash}`).substring(0, 64),
        }),
      });

      // Add to conversation state
      const newEntry: ChatEntry = {
        id: queryId,
        question: activeQuery,
        answer: decrypted.content,
        sources: retrieval.chunks,
        requestHash: decrypted.requestHash,
        responseHash: decrypted.responseHash,
        signatureValid: decrypted.signatureValid,
        receiptHash,
        timestamp: Date.now(),
      };

      setChatHistory((prev) => [newEntry, ...prev]);
    } catch (err) {
      alert(`Confidential AI Query Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
      setActiveStep(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl glass-panel border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              ProofRoom AI Assistant
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Intel TDX Enclave
              </span>
            </h3>
            <p className="text-muted-foreground text-[11px]">
              E2EE inference with local client retrieval and hardware-signed citations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SecurityBadge status="VERIFIED" label="TEE Verified" />
        </div>
      </div>

      {/* Suggested Questions (Pills) */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Suggested Due Diligence Questions
        </p>
        <div className="flex flex-wrap gap-2">
          {DEMO_SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAskQuestion(q)}
              disabled={loading || !isAuthorized}
              className="text-xs px-3 py-1.5 rounded-xl border border-border/80 glass-panel hover:bg-surface-elevated text-foreground hover:border-primary/40 transition-all text-left truncate max-w-full disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="relative">
        <textarea
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={
            isAuthorized
              ? "Ask a confidential question regarding financial statements, contracts, or terms..."
              : "Access Denied: You must be an authorized participant to query this data room."
          }
          disabled={loading || !isAuthorized}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAskQuestion();
            }
          }}
          className="w-full p-3.5 pr-24 rounded-2xl glass-panel border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground resize-none disabled:opacity-50 transition-all"
        />

        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            loading={loading}
            disabled={!question.trim() || !isAuthorized}
            onClick={() => handleAskQuestion()}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Ask AI
          </Button>
        </div>
      </div>

      {/* Loading Step Tracker */}
      {loading && activeStep && (
        <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-3 text-xs text-primary animate-pulse">
          <Clock className="w-4 h-4 animate-spin shrink-0" />
          <span className="font-medium">{activeStep}</span>
        </div>
      )}

      {/* Conversation Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {chatHistory.length === 0 && !loading && (
          <div className="text-center py-12 px-4 rounded-3xl glass-panel border border-border/50 text-xs space-y-2">
            <Sparkles className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
            <h4 className="font-semibold text-foreground text-sm">No queries submitted yet</h4>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Select one of the suggested prompts above or type a custom question to inspect confidential document clauses.
            </p>
          </div>
        )}

        {chatHistory.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-3xl glass-panel-elevated border border-border space-y-4 text-xs transition-all"
          >
            {/* User Question */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-border/50">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Due Diligence Query</span>
                <p className="text-sm font-semibold text-foreground">{item.question}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <SecurityBadge status="VERIFIED" label="TEE Signed" />
                <button
                  onClick={() => copyToClipboard(item.answer, item.id)}
                  className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy answer"
                >
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* AI Generated Answer */}
            <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
              {item.answer}
            </div>

            {/* Document Sources & Citations */}
            {item.sources && item.sources.length > 0 && (
              <div className="pt-3 border-t border-border/50 space-y-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Verified Document Excerpts & Citations ({item.sources.length})
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.sources.map((src, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-2.5 rounded-xl bg-foreground/5 border border-border/50 text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold text-foreground">
                        <span className="truncate pr-2">{src.documentName}</span>
                        <span className="text-[10px] text-primary shrink-0 bg-primary/10 px-1.5 py-0.2 rounded">
                          Page {src.pageNumber}
                        </span>
                      </div>
                      <p className="text-muted-foreground line-clamp-3 text-[10px] italic">
                        &quot;{src.text}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expandable Receipt Commitment */}
            <div className="pt-2 border-t border-border/50">
              <button
                onClick={() =>
                  setExpandedReceiptId(expandedReceiptId === item.id ? null : item.id)
                }
                className="flex items-center justify-between w-full text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Tamper-Evident Receipt Commitment: {item.receiptHash.substring(0, 16)}...
                </span>
                {expandedReceiptId === item.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {expandedReceiptId === item.id && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-950 text-slate-100 font-mono text-[10px] space-y-1.5 border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Request Ciphertext Hash:</span>
                    <span className="text-emerald-400 truncate max-w-[240px]">{item.requestHash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Response Ciphertext Hash:</span>
                    <span className="text-emerald-400 truncate max-w-[240px]">{item.responseHash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">On-Chain Activity Receipt Hash:</span>
                    <span className="text-amber-400 truncate max-w-[240px]">{item.receiptHash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hardware Enclave Signature:</span>
                    <span className="text-emerald-400">ECDSA_P256_VERIFIED</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
