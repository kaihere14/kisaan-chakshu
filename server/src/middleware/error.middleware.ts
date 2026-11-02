import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { HttpError } from "../utils/http-error.js";

export const errorMiddleware: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  if (response.headersSent) { next(error); return; }
  if (error instanceof HttpError) {
    response.status(error.statusCode).json({ error: { code: error.code, message: error.message }, ...(error.claimId ? { claimId: error.claimId } : {}) });
  } else if (error instanceof ZodError) {
    response.status(400).json({ error: { code: "invalid_input", message: "Check the submitted fields.", fields: error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })) } });
  } else if (error instanceof multer.MulterError) {
    response.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: { code: error.code, message: error.code === "LIMIT_FILE_SIZE" ? "Each photo must be at most 5 MiB." : "Invalid photo count or multipart form." } });
  } else if (error instanceof SyntaxError && "status" in error && error.status === 400) {
    response.status(400).json({ error: { code: "invalid_json", message: "Request body is not valid JSON." } });
  } else {
    // Do not leak connection strings, upstream credentials, or database internals.
    console.error("Claim request failed unexpectedly.");
    response.status(503).json({ error: { code: "service_unavailable", message: "The request could not be completed. Retry using the same Idempotency-Key." } });
  }
};
