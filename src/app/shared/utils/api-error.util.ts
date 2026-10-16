/**
 * Best human-readable message from an HttpErrorResponse-like value.
 * Checks, in order: a plain-string body, `error.message`, `error.error`, then `fallback`.
 */
export function extractApiError(err: unknown, fallback: string): string {
  const e = err as { error?: unknown; message?: unknown } | null | undefined;
  const body = e?.error;

  if (typeof body === 'string' && body.trim()) return body;
  if (body && typeof body === 'object') {
    const b = body as { message?: unknown; error?: unknown };
    if (typeof b.message === 'string' && b.message.trim()) return b.message;
    if (typeof b.error === 'string' && b.error.trim()) return b.error;
  }
  return fallback;
}
