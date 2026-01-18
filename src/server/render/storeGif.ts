import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";

const storage = new Storage();
const bucketName = process.env.RENDER_BUCKET;

export interface StoredGif {
  url: string;
  expiresAt: string;
  path: string;
}

const DEFAULT_TTL_MINUTES = 60 * 24 * 3; // 3 days

export async function storeGif(
  buffer: Buffer,
  ttlMinutes: number = DEFAULT_TTL_MINUTES
): Promise<StoredGif> {
  if (!bucketName) {
    throw new Error("RENDER_BUCKET env var is required for storing renders");
  }

  const bucket = storage.bucket(bucketName);
  const filePath = `renders/${new Date().toISOString()}-${uuidv4()}.gif`;
  const file = bucket.file(filePath);

  await file.save(buffer, {
    contentType: "image/gif",
    public: false,
    cacheControl: "public, max-age=60",
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
