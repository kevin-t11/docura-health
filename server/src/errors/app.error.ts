/** Expected application failures that can be safely returned to a client. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}
