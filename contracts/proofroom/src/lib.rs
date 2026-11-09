use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedMap, Vector};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, near, require, AccountId, PanicOnDefault};

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct RoomRecord {
    pub room_id: String,
    pub owner_id: AccountId,
    pub room_commitment: String,
    pub metadata_commitment: String,
    pub created_at: u64,
    pub status: String,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct PermissionRecord {
    pub participant_commitment: String,
    pub permission_commitment: String,
    pub granted_at: u64,
    pub expires_at: Option<u64>,
    pub revoked: bool,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct DocumentRecord {
    pub document_id: String,
    pub document_hash: String,
    pub version: u32,
    pub registered_at: u64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct ReceiptRecord {
    pub receipt_hash: String,
    pub verification_status: String,
    pub recorded_by: AccountId,
    pub timestamp: u64,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct ProofRoomContract {
    pub rooms: UnorderedMap<String, RoomRecord>,
    pub room_documents: LookupMap<String, Vector<DocumentRecord>>,
    pub room_permissions: LookupMap<String, Vector<PermissionRecord>>,
    pub room_receipts: LookupMap<String, Vector<ReceiptRecord>>,
}

#[near]
impl ProofRoomContract {
    #[init]
    pub fn new() -> Self {
        require!(!env::state_exists(), "Already initialized");
        Self {
            rooms: UnorderedMap::new(b"r"),
            room_documents: LookupMap::new(b"d"),
            room_permissions: LookupMap::new(b"p"),
            room_receipts: LookupMap::new(b"q"),
        }
    }

    /// Creates a new confidential data room with opaque commitments.
    pub fn create_room(
        &mut self,
        room_id: String,
        room_commitment: String,
        metadata_commitment: String,
    ) {
        require!(
            !room_id.is_empty() && room_id.len() <= 128,
            "Invalid room_id length"
        );
        require!(
            !room_commitment.is_empty() && room_commitment.len() <= 256,
            "Invalid room_commitment length"
        );
        require!(
            !self.rooms.get(&room_id).is_some(),
            "Room already exists"
        );

        let caller = env::predecessor_account_id();
        let record = RoomRecord {
            room_id: room_id.clone(),
            owner_id: caller.clone(),
            room_commitment,
            metadata_commitment,
            created_at: env::block_timestamp_ms(),
            status: "active".to_string(),
        };

        self.rooms.insert(&room_id, &record);

        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"proofroom\",\"version\":\"1.0.0\",\"event\":\"room_created\",\"data\":[{{\"room_id\":\"{}\",\"owner_id\":\"{}\"}}]}}",
            room_id, caller
        ));
    }

    /// Grants access to an authorized participant with permission commitment and optional expiration.
    pub fn grant_access(
        &mut self,
        room_id: String,
        participant_commitment: String,
        permission_commitment: String,
        expires_at: Option<u64>,
    ) {
        let room = self.rooms.get(&room_id).expect("Room does not exist");
        let caller = env::predecessor_account_id();
        require!(room.owner_id == caller, "Only room owner can grant access");

        require!(
            !participant_commitment.is_empty() && participant_commitment.len() <= 256,
            "Invalid participant_commitment"
        );
        require!(
            !permission_commitment.is_empty() && permission_commitment.len() <= 256,
            "Invalid permission_commitment"
        );

        let perm_key = format!("p_{}", room_id);
        let mut perms = self
            .room_permissions
            .get(&room_id)
            .unwrap_or_else(|| Vector::new(perm_key.into_bytes()));

        // Check if there is an existing non-revoked permission for this participant commitment and update it
        let mut found = false;
        for i in 0..perms.len() {
            let mut p = perms.get(i).unwrap();
            if p.participant_commitment == participant_commitment {
                p.permission_commitment = permission_commitment.clone();
                p.expires_at = expires_at;
                p.revoked = false;
                p.granted_at = env::block_timestamp_ms();
                perms.replace(i, &p);
                found = true;
                break;
            }
        }

        if !found {
            perms.push(&PermissionRecord {
                participant_commitment: participant_commitment.clone(),
                permission_commitment,
                granted_at: env::block_timestamp_ms(),
                expires_at,
                revoked: false,
            });
        }

        self.room_permissions.insert(&room_id, &perms);

        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"proofroom\",\"version\":\"1.0.0\",\"event\":\"access_granted\",\"data\":[{{\"room_id\":\"{}\",\"participant_commitment\":\"{}\"}}]}}",
            room_id, participant_commitment
        ));
    }

    /// Revokes an existing permission for a participant commitment.
    pub fn revoke_access(&mut self, room_id: String, participant_commitment: String) {
        let room = self.rooms.get(&room_id).expect("Room does not exist");
        let caller = env::predecessor_account_id();
        require!(room.owner_id == caller, "Only room owner can revoke access");

        if let Some(mut perms) = self.room_permissions.get(&room_id) {
            let mut updated = false;
            for i in 0..perms.len() {
                let mut p = perms.get(i).unwrap();
                if p.participant_commitment == participant_commitment && !p.revoked {
                    p.revoked = true;
                    perms.replace(i, &p);
                    updated = true;
                }
            }
            if updated {
                self.room_permissions.insert(&room_id, &perms);
                env::log_str(&format!(
                    "EVENT_JSON:{{\"standard\":\"proofroom\",\"version\":\"1.0.0\",\"event\":\"access_revoked\",\"data\":[{{\"room_id\":\"{}\",\"participant_commitment\":\"{}\"}}]}}",
                    room_id, participant_commitment
                ));
            }
        }
    }

    /// Registers a document commitment (opaque ID, hash of ciphertext, version).
    pub fn register_document(
        &mut self,
        room_id: String,
        document_id: String,
        document_hash: String,
        version: u32,
    ) {
        let room = self.rooms.get(&room_id).expect("Room does not exist");
        let caller = env::predecessor_account_id();
        require!(room.owner_id == caller, "Only room owner can register documents");

        require!(
            !document_id.is_empty() && document_id.len() <= 128,
            "Invalid document_id length"
        );
        require!(
            !document_hash.is_empty() && document_hash.len() <= 256,
            "Invalid document_hash length"
        );

        let doc_key = format!("d_{}", room_id);
        let mut docs = self
            .room_documents
            .get(&room_id)
            .unwrap_or_else(|| Vector::new(doc_key.into_bytes()));

        docs.push(&DocumentRecord {
            document_id: document_id.clone(),
            document_hash,
            version,
            registered_at: env::block_timestamp_ms(),
        });

        self.room_documents.insert(&room_id, &docs);

        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"proofroom\",\"version\":\"1.0.0\",\"event\":\"document_registered\",\"data\":[{{\"room_id\":\"{}\",\"document_id\":\"{}\",\"version\":{}}}]}}",
            room_id, document_id, version
        ));
    }

    /// Records a privacy-preserving verifiable AI activity receipt.
    pub fn record_query_receipt(
        &mut self,
        room_id: String,
        receipt_hash: String,
        verification_status: String,
        timestamp: u64,
    ) {
        let _room = self.rooms.get(&room_id).expect("Room does not exist");
        let caller = env::predecessor_account_id();

        require!(
            !receipt_hash.is_empty() && receipt_hash.len() <= 256,
            "Invalid receipt_hash length"
        );

        let q_key = format!("q_{}", room_id);
        let mut receipts = self
            .room_receipts
            .get(&room_id)
            .unwrap_or_else(|| Vector::new(q_key.into_bytes()));

        receipts.push(&ReceiptRecord {
            receipt_hash: receipt_hash.clone(),
            verification_status: verification_status.clone(),
            recorded_by: caller.clone(),
            timestamp: if timestamp > 0 { timestamp } else { env::block_timestamp_ms() },
        });

        self.room_receipts.insert(&room_id, &receipts);

        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"proofroom\",\"version\":\"1.0.0\",\"event\":\"receipt_anchored\",\"data\":[{{\"room_id\":\"{}\",\"receipt_hash\":\"{}\",\"verification_status\":\"{}\"}}]}}",
            room_id, receipt_hash, verification_status
        ));
    }

    // --- View Methods ---

    pub fn get_room(&self, room_id: String) -> Option<RoomRecord> {
        self.rooms.get(&room_id)
    }

    pub fn get_room_owner(&self, room_id: String) -> Option<AccountId> {
        self.rooms.get(&room_id).map(|r| r.owner_id)
    }

    pub fn get_room_documents(
        &self,
        room_id: String,
        from_index: Option<u64>,
        limit: Option<u64>,
    ) -> Vec<DocumentRecord> {
        if let Some(docs) = self.room_documents.get(&room_id) {
            let start = from_index.unwrap_or(0);
            let take = limit.unwrap_or(50).min(100);
            (start..std::cmp::min(start + take, docs.len()))
                .filter_map(|i| docs.get(i))
                .collect()
        } else {
            vec![]
        }
    }

    pub fn get_room_permissions(
        &self,
        room_id: String,
        from_index: Option<u64>,
        limit: Option<u64>,
    ) -> Vec<PermissionRecord> {
        if let Some(perms) = self.room_permissions.get(&room_id) {
            let start = from_index.unwrap_or(0);
            let take = limit.unwrap_or(50).min(100);
            (start..std::cmp::min(start + take, perms.len()))
                .filter_map(|i| perms.get(i))
                .collect()
        } else {
            vec![]
        }
    }

    pub fn is_participant_authorized(
        &self,
        room_id: String,
        participant_commitment: String,
    ) -> bool {
        if let Some(perms) = self.room_permissions.get(&room_id) {
            let now = env::block_timestamp_ms();
            for i in 0..perms.len() {
                if let Some(p) = perms.get(i) {
                    if p.participant_commitment == participant_commitment && !p.revoked {
                        if let Some(exp) = p.expires_at {
                            if exp > now {
                                return true;
                            }
                        } else {
                            return true;
                        }
                    }
                }
            }
        }
        false
    }

    pub fn get_room_receipts(
        &self,
        room_id: String,
        from_index: Option<u64>,
        limit: Option<u64>,
    ) -> Vec<ReceiptRecord> {
        if let Some(receipts) = self.room_receipts.get(&room_id) {
            let start = from_index.unwrap_or(0);
            let take = limit.unwrap_or(50).min(100);
            (start..std::cmp::min(start + take, receipts.len()))
                .filter_map(|i| receipts.get(i))
                .collect()
        } else {
            vec![]
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::testing_env;

    fn get_context(predecessor: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder.predecessor_account_id(predecessor);
        builder.block_timestamp(1_000_000_000_000);
        builder
    }

    #[test]
    fn test_create_room_and_permissions() {
        let owner: AccountId = "founder.testnet".parse().unwrap();
        let _investor: AccountId = "investor.testnet".parse().unwrap();

        let context = get_context(owner.clone());
        testing_env!(context.build());

        let mut contract = ProofRoomContract::new();
        contract.create_room(
            "room-123".to_string(),
            "sha256-room-commitment-xyz".to_string(),
            "sha256-meta-xyz".to_string(),
        );

        let room = contract.get_room("room-123".to_string()).unwrap();
        assert_eq!(room.owner_id, owner);
        assert_eq!(room.status, "active");

        // Grant access
        contract.grant_access(
            "room-123".to_string(),
            "part-commit-investor".to_string(),
            "perm-commit-read-only".to_string(),
            Some(2_000_000_000_000),
        );

        assert!(contract.is_participant_authorized(
            "room-123".to_string(),
            "part-commit-investor".to_string()
        ));

        // Revoke access
        contract.revoke_access(
            "room-123".to_string(),
            "part-commit-investor".to_string(),
        );

        assert!(!contract.is_participant_authorized(
            "room-123".to_string(),
            "part-commit-investor".to_string()
        ));
    }
}
