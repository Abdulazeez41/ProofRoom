import { prisma } from "../src/lib/db/prisma";
import { NORTHSTAR_DEMO_COMPANY, DEMO_DOCUMENTS } from "../src/lib/demo/northstar-data";
import { generateDataEncryptionKey, encryptDocumentBytes } from "../src/lib/crypto/aes-gcm";
import { generateUserEncryptionKeyPair, getDeterministicKeyPair, createKeyEnvelope } from "../src/lib/crypto/key-wrapping";
import { computeRoomCommitment, computeParticipantCommitment, computePermissionCommitment, computeSha256 } from "../src/lib/crypto/hashing";
import { saveEncryptedBlob } from "../src/lib/storage";

async function main() {
  console.log("Seeding Northstar Technologies Demo Workspace...");

  const founderKeys = getDeterministicKeyPair(`proofroom:demo:${NORTHSTAR_DEMO_COMPANY.founderAccount}:v1`);
  const investorKeys = getDeterministicKeyPair(`proofroom:demo:${NORTHSTAR_DEMO_COMPANY.investorAccount}:v1`);

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

  const participantCommitment = computeParticipantCommitment(investorUser.nearAccountId, room.opaqueRoomId);
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
    },
    create: {
      roomId: room.id,
      participantUserId: investorUser.id,
      participantNearAccount: investorUser.nearAccountId,
      permissionStatus: "ACTIVE",
      permissionCommitment,
    },
  });

  for (const docDef of DEMO_DOCUMENTS) {
    const dek = generateDataEncryptionKey();
    const plaintextBytes = new TextEncoder().encode(docDef.content);
    const encrypted = await encryptDocumentBytes(plaintextBytes, dek);

    const storageKey = `${room.opaqueRoomId}_${docDef.documentId}`;
    await saveEncryptedBlob(storageKey, encrypted.ciphertext);

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

    await prisma.documentKeyEnvelope.deleteMany({ where: { documentId: docRecord.id } });
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
  }

  console.log("✓ Seed completed! Room created at:", opaqueRoomId);
}

main().catch(console.error);
