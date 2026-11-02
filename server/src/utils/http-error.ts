export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly claimId?: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
