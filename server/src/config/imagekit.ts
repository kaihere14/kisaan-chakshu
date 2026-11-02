import ImageKit, { toFile } from "@imagekit/nodejs";
import { getImageKitConfig } from "./env.js";
import type { ClaimImageStore } from "../claim/claim.types.js";

let client: ImageKit | undefined;
function getClient(): ImageKit {
  if (!client) {
    const config = getImageKitConfig();
    client = new ImageKit({ privateKey: config.privateKey, timeout: 60_000, maxRetries: 0 });
  }
  return client;
}

export const claimImageStore: ClaimImageStore = {
  async upload(claimId, file, index) {
    const response = await getClient().files.upload({
      file: await toFile(file.buffer, file.fileName, { type: file.mimeType }),
      fileName: `${index + 1}-${file.fileName}`,
      folder: `/kisaan-chakshu/claims/${claimId}`,
      tags: [`claim-${claimId}`],
      useUniqueFileName: true,
    });
    if (!response.fileId || !response.url || new URL(response.url).protocol !== "https:") {
      if (response.fileId) await getClient().files.delete(response.fileId);
      throw new Error("ImageKit did not return a valid uploaded file reference.");
    }
    return { fileId: response.fileId, url: response.url };
  },
  async delete(fileId) {
    try {
      await getClient().files.delete(fileId, { timeout: 10_000 });
    } catch (error) {
      if (error instanceof ImageKit.APIError && error.status === 404) return;
      throw error;
    }
  },
};
