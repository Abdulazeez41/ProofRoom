import { NEAR_CONFIG } from "./config";

export interface OnChainRoomRecord {
  room_id: string;
  owner_id: string;
  room_commitment: string;
  metadata_commitment: string;
  created_at: number;
  status: string;
}

export interface OnChainDocumentRecord {
  document_id: string;
  document_hash: string;
  version: number;
  registered_at: number;
}

export interface OnChainPermissionRecord {
  participant_commitment: string;
  permission_commitment: string;
  granted_at: number;
  expires_at: number | null;
  revoked: boolean;
}

export interface OnChainReceiptRecord {
  receipt_hash: string;
  verification_status: string;
  recorded_by: string;
  timestamp: number;
}

/**
 * Invokes a view method on the NEAR Testnet smart contract via JSON-RPC.
 */
export async function callContractView<T>(
  methodName: string,
  args: Record<string, unknown> = {}
): Promise<T | null> {
  try {
    const argsBase64 = Buffer.from(JSON.stringify(args)).toString("base64");
    const response = await fetch(NEAR_CONFIG.nodeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "proofroom-view",
        method: "query",
        params: {
          request_type: "call_function",
          finality: "final",
          account_id: NEAR_CONFIG.contractId,
          method_name: methodName,
          args_base64: argsBase64,
        },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.error || !data.result?.result) {
      return null;
    }

    const rawBytes = new Uint8Array(data.result.result);
    const decodedText = new TextDecoder().decode(rawBytes);
    return JSON.parse(decodedText) as T;
  } catch (err) {
    console.warn(`NEAR RPC view call error (${methodName}):`, err);
    return null;
  }
}

/**
 * Fetches on-chain room record.
 */
export async function getOnChainRoom(roomId: string): Promise<OnChainRoomRecord | null> {
  return callContractView<OnChainRoomRecord>("get_room", { room_id: roomId });
}

/**
 * Fetches on-chain documents for a room.
 */
export async function getOnChainDocuments(
  roomId: string,
  fromIndex = 0,
  limit = 50
): Promise<OnChainDocumentRecord[]> {
  const docs = await callContractView<OnChainDocumentRecord[]>("get_room_documents", {
    room_id: roomId,
    from_index: fromIndex,
    limit,
  });
  return docs || [];
}

/**
 * Fetches on-chain permissions for a room.
 */
export async function getOnChainPermissions(
  roomId: string,
  fromIndex = 0,
  limit = 50
): Promise<OnChainPermissionRecord[]> {
  const perms = await callContractView<OnChainPermissionRecord[]>("get_room_permissions", {
    room_id: roomId,
    from_index: fromIndex,
    limit,
  });
  return perms || [];
}

/**
 * Fetches on-chain privacy receipts for a room.
 */
export async function getOnChainReceipts(
  roomId: string,
  fromIndex = 0,
  limit = 50
): Promise<OnChainReceiptRecord[]> {
  const receipts = await callContractView<OnChainReceiptRecord[]>("get_room_receipts", {
    room_id: roomId,
    from_index: fromIndex,
    limit,
  });
  return receipts || [];
}
