# ProofRoom - NEAR Testnet Smart Contract Reference

## Contract Account: `proofroom-app.testnet`

- **Network**: NEAR Testnet
- **Standard**: ProofRoom On-Chain Commitment Protocol v1.0.0
- **Explorer**: `https://explorer.testnet.near.org`
- **RPC**: `https://rpc.testnet.near.org`

## State Storage

The smart contract stores only privacy-preserving commitments:

1. `rooms: UnorderedMap<String, RoomRecord>`
2. `room_documents: LookupMap<String, Vector<DocumentRecord>>`
3. `room_permissions: LookupMap<String, Vector<PermissionRecord>>`
4. `room_receipts: LookupMap<String, Vector<ReceiptRecord>>`

## Change Methods

### `create_room(room_id, room_commitment, metadata_commitment)`

- **Caller**: Becomes room owner.
- **Preconditions**: `room_id` must be unique and <= 128 characters.
- **Emits**: Event `room_created`.

### `grant_access(room_id, participant_commitment, permission_commitment, expires_at)`

- **Caller**: Must be room owner.
- **Preconditions**: Room must exist.
- **Behavior**: Records permission commitment and optional millisecond expiry timestamp.

### `revoke_access(room_id, participant_commitment)`

- **Caller**: Must be room owner.
- **Behavior**: Flags permission record as revoked (`revoked = true`). Halts verification of future access checks.

### `register_document(room_id, document_id, document_hash, version)`

- **Caller**: Must be room owner.
- **Behavior**: Anchors the document ciphertext hash on-chain with sequential versioning.

### `record_query_receipt(room_id, receipt_hash, verification_status, timestamp)`

- **Caller**: Authorized participant or verifier service.
- **Behavior**: Commits an immutable audit record linking the opaque room ID, receipt hash, and verification status.

## View Methods

- `get_room(room_id: String) -> Option<RoomRecord>`
- `get_room_owner(room_id: String) -> Option<AccountId>`
- `is_participant_authorized(room_id: String, participant_commitment: String) -> bool`
- `get_room_documents(room_id: String, from_index: Option<u64>, limit: Option<u64>) -> Vec<DocumentRecord>`
- `get_room_permissions(room_id: String, from_index: Option<u64>, limit: Option<u64>) -> Vec<PermissionRecord>`
- `get_room_receipts(room_id: String, from_index: Option<u64>, limit: Option<u64>) -> Vec<ReceiptRecord>`
