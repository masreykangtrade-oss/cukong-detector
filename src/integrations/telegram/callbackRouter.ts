export interface ParsedCallback {
  namespace: string;
  action: string;
  accountId?: string;
  pair?: string;
}

export function buildCallback(namespace: string, action: string, accountId?: string, pair?: string): string {
  const parts = \[namespace, action, accountId ?? '', pair ?? ''];
  return parts.join('|').slice(0, 64);
}

export function parseCallback(value: string): ParsedCallback | null {
  if (!value || value.length > 64) {
    return null;
  }

  const \[namespace, action, accountId, pair] = value.split('|');
  if (!namespace || !action) {
    return null;
  }

  return {
    namespace,
    action,
    accountId: accountId || undefined,
    pair: pair || undefined,
  };
}
