import { getStorage } from "firebase-admin/storage";

export interface StoredGif {
  url: string;
  expiresAt: string;
  path: string;
}

const DEFAULT_TTL_MINUTES = 60 * 24 * 3; // 3 days

export async function storeGif(
  buffer: Buffer,
  bucketName: string | undefined,
  ttlMinutes: number = DEFAULT_TTL_MINUTES,
): Promise<StoredGif> {
  const bucket = getStorage().bucket(bucketName);
  const filePath = `renders/${new Date().toISOString()}-${Math.random().toString(16).slice(2)}.gif`;
  const file = bucket.file(filePath);

  await file.save(buffer, {
    metadata: {
      contentType: "image/gif",
      cacheControl: "public, max-age=60",
    },
    public: false,
  });

  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: expiresAt,
  });

  return {
    url: signedUrl,
    expiresAt: expiresAt.toISOString(),
    path: filePath,
  };
}
