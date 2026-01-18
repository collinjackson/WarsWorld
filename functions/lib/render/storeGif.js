"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeGif = storeGif;
const storage_1 = require("firebase-admin/storage");
const DEFAULT_TTL_MINUTES = 60 * 24 * 3; // 3 days
async function storeGif(buffer, bucketName, ttlMinutes = DEFAULT_TTL_MINUTES) {
    const bucket = (0, storage_1.getStorage)().bucket(bucketName);
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
