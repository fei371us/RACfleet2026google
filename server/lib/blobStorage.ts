import { BlobSASPermissions, BlobServiceClient } from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING ?? '';
const containerName = process.env.AZURE_STORAGE_CONTAINER ?? 'inspection-photos';

function ensureConfigured() {
  if (!connectionString) {
    throw new Error('Azure Blob storage is not configured. Set AZURE_STORAGE_CONNECTION_STRING.');
  }
}

function getContainerClient() {
  ensureConfigured();
  const service = BlobServiceClient.fromConnectionString(connectionString);
  return service.getContainerClient(containerName);
}

function sanitizeName(name: string) {
  const normalized = name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
  return normalized || 'photo.jpg';
}

export function isBlobStorageConfigured() {
  return Boolean(connectionString);
}

export async function createPinPhotoUploadUrl(pinId: number, fileName: string) {
  const container = getContainerClient();
  await container.createIfNotExists();

  const blobPath = `pins/${pinId}/${Date.now()}-${sanitizeName(fileName)}`;
  const blob = container.getBlockBlobClient(blobPath);
  const uploadUrl = await blob.generateSasUrl({
    permissions: BlobSASPermissions.parse('cw'),
    startsOn: new Date(Date.now() - 60_000),
    expiresOn: new Date(Date.now() + 15 * 60_000),
  });

  return { uploadUrl, blobPath };
}

export async function createPinPhotoReadUrl(photoPathOrUrl: string) {
  if (!photoPathOrUrl) return '';
  if (/^https?:\/\//i.test(photoPathOrUrl) || /^data:image\//i.test(photoPathOrUrl)) return photoPathOrUrl;

  const container = getContainerClient();
  const blob = container.getBlockBlobClient(photoPathOrUrl);
  return blob.generateSasUrl({
    permissions: BlobSASPermissions.parse('r'),
    startsOn: new Date(Date.now() - 60_000),
    expiresOn: new Date(Date.now() + 30 * 60_000),
  });
}

export async function deletePinPhoto(photoPathOrUrl: string | null | undefined) {
  if (!photoPathOrUrl || /^https?:\/\//i.test(photoPathOrUrl) || /^data:image\//i.test(photoPathOrUrl)) return;
  const container = getContainerClient();
  const blob = container.getBlockBlobClient(photoPathOrUrl);
  await blob.deleteIfExists();
}
