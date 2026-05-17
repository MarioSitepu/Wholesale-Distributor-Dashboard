/** Error HTTP yang membawa status code */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const Errors = {
  unauthorized: (msg = 'Token tidak valid atau sudah kedaluwarsa') =>
    new HttpError(401, msg),
  forbidden: (msg = 'Akses ditolak') =>
    new HttpError(403, msg),
  notFound: (msg = 'Data tidak ditemukan') =>
    new HttpError(404, msg),
  conflict: (msg: string) =>
    new HttpError(409, msg),
  badRequest: (msg: string) =>
    new HttpError(400, msg),
  unprocessable: (msg: string, extra?: Record<string, unknown>) =>
    new HttpError(422, msg, extra),
};
