import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  NORTHSTAR_DEMO_COMPANY,
  DEMO_DOCUMENTS,
} from "@/lib/demo/northstar-data";
import {
  generateDataEncryptionKey,
  encryptDocumentBytes,
} from "@/lib/crypto/aes-gcm";
import {
  generateUserEncryptionKeyPair,
  createKeyEnvelope,
} from "@/lib/crypto/key-wrapping";
import {
  computeRoomCommitment,
  computeParticipantCommitment,
  computePermissionCommitment,
  computeSha256,
} from "@/lib/crypto/hashing";
import { saveEncryptedBlob } from "@/lib/storage";

export async function POST() {
  try {
    // 1. Create or ensure Founder and Investor users with X25519 public keys
    const founderKeys = generateUserEncryptionKeyPair();
    const investorKeys = generateUserEncryptionKeyPair();

    const founderUser = await prisma.user.upsert({
      where: { nearAccountId: NORTHSTAR_DEMO_COMPANY.founderAccount },
      update: { encryptionPublicKey: founderKeys.publicKeyHex },
      create: {
        nearAccountId: NORTHSTAR_DEMO_COMPANY.founderAccount,
        encryptionPublicKey: founderKeys.publicKeyHex,
      },
    });

    const investorUser = await prisma.user.upsert({
      where: { nearAccountId: NORTHSTAR_DEMO_COMPANY.investorAccount },
      update: { encryptionPublicKey: investorKeys.publicKeyHex },
      create: {
        nearAccountId: NORTHSTAR_DEMO_COMPANY.investorAccount,
        encryptionPublicKey: investorKeys.publicKeyHex,
      },
    });

    // 2. Create Northstar Room
    const opaqueRoomId = "room-northstar-series-a";
    const roomCommitment = computeRoomCommitment(opaqueRoomId, "northstar-salt-2026");
    const metadataCommitment = computeSha256(
      JSON.stringify({
        company: NORTHSTAR_DEMO_COMPANY.name,
        room: NORTHSTAR_DEMO_COMPANY.roomName,
        purpose: NORTHSTAR_DEMO_COMPANY.purpose,
      })
    );

    const room = await prisma.room.upsert({
      where: { opaqueRoomId },
      update: {
        name: NORTHSTAR_DEMO_COMPANY.roomName,
        companyName: NORTHSTAR_DEMO_COMPANY.name,
        description: NORTHSTAR_DEMO_COMPANY.description,
        purpose: NORTHSTAR_DEMO_COMPANY.purpose,
      },
      create: {
        opaqueRoomId,
        ownerUserId: founderUser.id,
        name: NORTHSTAR_DEMO_COMPANY.roomName,
        companyName: NORTHSTAR_DEMO_COMPANY.name,
        description: NORTHSTAR_DEMO_COMPANY.description,
        purpose: NORTHSTAR_DEMO_COMPANY.purpose,
        roomCommitment,
        metadataCommitment,
      },
    });

    // 3. Add Investor Participant
    const participantCommitment = computeParticipantCommitment(
      investorUser.nearAccountId,
      room.opaqueRoomId
    );
    const permissionCommitment = computePermissionCommitment(
      participantCommitment,
      "Series A Lead Syndicate",
      Date.now() + 90 * 24 * 60 * 60 * 1000
    );

    await prisma.roomParticipant.upsert({
      where: {
        roomId_participantNearAccount: {
          roomId: room.id,
          participantNearAccount: investorUser.nearAccountId,
        },
      },
      update: {
        permissionStatus: "ACTIVE",
        permissionCommitment,
        revokedAt: null,
      },
      create: {
        roomId: room.id,
        participantUserId: investorUser.id,
        participantNearAccount: investorUser.nearAccountId,
        permissionStatus: "ACTIVE",
        permissionCommitment,
      },
    });

    // 4. Encrypt and save Demo Documents with Key Envelopes
    const createdDocuments = [];

    for (const docDef of DEMO_DOCUMENTS) {
      const dek = generateDataEncryptionKey();
      const plaintextBytes = new TextEncoder().encode(docDef.content);
      const encrypted = await encryptDocumentBytes(plaintextBytes, dek);

      const storageKey = `${room.opaqueRoomId}_${docDef.documentId}`;
      await saveEncryptedBlob(storageKey, encrypted.ciphertext);

      // Create Key Envelopes for Founder and Investor
      const founderEnvelope = await createKeyEnvelope(dek, founderKeys.publicKeyHex);
      const investorEnvelope = await createKeyEnvelope(dek, investorKeys.publicKeyHex);

      const docRecord = await prisma.document.upsert({
        where: { opaqueDocumentId: docDef.documentId },
        update: {
          name: docDef.name,
          category: docDef.category,
          encryptedStorageKey: storageKey,
          encryptedSize: encrypted.byteLength,
          ciphertextHash: encrypted.ciphertextHash,
        },
        create: {
          roomId: room.id,
          opaqueDocumentId: docDef.documentId,
          name: docDef.name,
          category: docDef.category,
          encryptedStorageKey: storageKey,
          encryptedSize: encrypted.byteLength,
          ciphertextHash: encrypted.ciphertextHash,
          version: 1,
          mimeType: "text/plain",
          encryptionAlgorithm: "AES-256-GCM",
        },
      });

      // Save key envelopes
      await prisma.documentKeyEnvelope.deleteMany({
        where: { documentId: docRecord.id },
      });

      await prisma.documentKeyEnvelope.createMany({
        data: [
          {
            documentId: docRecord.id,
            recipientUserId: founderUser.id,
            encryptedKeyEnvelope: JSON.stringify(founderEnvelope),
            recipientKeyVersion: 1,
          },
          {
            documentId: docRecord.id,
            recipientUserId: investorUser.id,
            encryptedKeyEnvelope: JSON.stringify(investorEnvelope),
            recipientKeyVersion: 1,
          },
        ],
      });

      createdDocuments.push({
        id: docRecord.id,
        name: docRecord.name,
        ciphertextHash: docRecord.ciphertextHash,
      });
    }

    // 5. Seed initial on-chain audit receipt
    await prisma.auditReceipt.create({
      data: {
        roomId: room.id,
        opaqueReceiptId: "rec-genesis-northstar",
        receiptHash: computeSha256(`genesis:${room.opaqueRoomId}:commitments`),
        eventType: "ROOM_INITIALIZED_AND_SEEDED",
        verificationStatus: "VERIFIED",
        transactionHash: "7b4c92ef01a89c34d56789abcdef0123456789abcdef0123456789abcdef0123",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Northstar Technologies demo workspace seeded successfully.",
      room: {
        id: room.id,
        opaqueRoomId: room.opaqueRoomId,
        name: room.name,
        owner: founderUser.nearAccountId,
        participant: investorUser.nearAccountId,
      },
      documents: createdDocuments,
      demoKeys: {
        founder: founderKeys,
        investor: investorKeys,
      },
    });
  } catch (err) {
    console.error("Demo seed error:", err);
    return NextResponse.json({ error: "Failed to seed demo environment" }, { status: 500 });
  }
}
