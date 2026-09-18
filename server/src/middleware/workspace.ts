/**
 * Docura has no user accounts. A workspace is a signed cookie that ties
 * uploads, files, and chat to one browser so documents stay isolated.
 */
import { AppError } from '@/errors/app.error';
import { workspaceIdSchema } from '@/schemas/document.schema';
import type { RequestHandler, Response } from 'express';

/**
 * Assign or restore the workspace cookie, then store its id on `res.locals`.
 *
 * Blocks cross-site mutating requests. Issues a new id when the cookie is
 * missing or invalid.
 */
export const workspaceSession: RequestHandler = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
    req.headers['sec-fetch-site'] === 'cross-site'
  ) {
    return next(new AppError('Cross-site requests are not allowed.', 403));
  }
  const existing = workspaceIdSchema.safeParse(req.signedCookies.docura_workspace);
  const workspace = existing.success ? existing.data : crypto.randomUUID();
  if (!existing.success) {
    res.cookie('docura_workspace', workspace, {
      signed: true,
      httpOnly: true,
      sameSite: 'strict',
      secure: req.secure,
      maxAge: 30 * 24 * 60 * 60_000,
      path: '/'
    });
  }
  res.locals.workspace = workspace;
  next();
};

/**
 * Workspace id for this request.
 *
 * @throws {AppError} If `workspaceSession` did not run.
 */
export function getWorkspaceId(res: Response): string {
  const parsed = workspaceIdSchema.safeParse(res.locals.workspace);
  if (!parsed.success) {
    throw new AppError('Workspace session is unavailable.', 500);
  }
  return parsed.data;
}
