import multer from "multer";
import { MAX_CLAIM_PHOTOS, MAX_PHOTO_BYTES } from "../claim/claim.schema.js";
import { HttpError } from "../utils/http-error.js";

export const uploadClaimPhotos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_BYTES, files: MAX_CLAIM_PHOTOS, fields: 20, fieldSize: 8192, parts: 25 },
  fileFilter(_request, file, callback) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      callback(new HttpError(415, "unsupported_image_type", "Photos must be JPEG, PNG or WebP."));
      return;
    }
    callback(null, true);
  },
}).array("photos", MAX_CLAIM_PHOTOS);
