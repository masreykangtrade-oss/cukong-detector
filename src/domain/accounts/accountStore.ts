import path from 'node:path';
import { env } from '../../config/env';
import type { AccountCredential, AccountsMeta, LegacyAccountInput } from '../../core/types';
import { JsonStore } from '../../storage/jsonStore';
import { nowIso } from '../../utils/time';
import { parseLegacyAccounts } from '../../utils/validators';

function createAccountId(name: string): string {
  return `${name.trim().toLowerCase().replace(/\[^a-z0-9]+/g, '-')}-${Date.now()}`;
}

export class AccountStore {
  private readonly accountsStore = new JsonStore<AccountCredential\[]>(path.join(env.DATA\_DIR, 'accounts', 'accounts.json'), \[]);
  private readonly metaStore = new JsonStore<AccountsMeta>(path.join(env.DATA\_DIR, 'accounts-meta.json'), {
    lastUpdatedAt: null,
    defaultAccountId: null,
    source: 'manual',
    totalAccounts: 0,
  });

  getFilePath(): string {
    return this.accountsStore.getPath();
  }

  async loadAll(): Promise<AccountCredential\[]> {
    return this.accountsStore.read();
  }

  async loadMeta(): Promise<AccountsMeta> {
    return this.metaStore.read();
  }

  async saveAll(accounts: AccountCredential\[], source: AccountsMeta\['source'] = 'manual'): Promise<void> {
    await this.accountsStore.write(accounts);

    const defaultAccount = accounts.find((item) => item.isDefault) ?? null;
    await this.metaStore.write({
      lastUpdatedAt: nowIso(),
      defaultAccountId: defaultAccount?.id ?? null,
      source,
      totalAccounts: accounts.length,
    });
  }

  async saveLegacyUpload(input: unknown): Promise<AccountCredential\[]> {
    const parsed = parseLegacyAccounts(input);
    const now = nowIso();
    const accounts = parsed.map((item, index): AccountCredential => ({
      id: createAccountId(item.name),
      name: item.name.trim(),
      apiKey: item.apiKey.trim(),
      apiSecret: item.apiSecret.trim(),
      enabled: true,
      isDefault: index === 0,
      createdAt: now,
      updatedAt: now,
    }));
    await this.saveAll(accounts, 'telegram\_upload');
    return accounts;
  }

  async upsertLegacyAccounts(items: LegacyAccountInput\[]): Promise<AccountCredential\[]> {
    const current = await this.loadAll();
    const currentByName = new Map(current.map((item) => \[item.name.toLowerCase(), item]));
    const now = nowIso();

    const next: AccountCredential\[] = items.map((item, index) => {
      const existing = currentByName.get(item.name.toLowerCase());
      return {
        id: existing?.id ?? createAccountId(item.name),
        name: item.name.trim(),
        apiKey: item.apiKey.trim(),
        apiSecret: item.apiSecret.trim(),
        enabled: existing?.enabled ?? true,
        isDefault: existing?.isDefault ?? index === 0,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
    });

    if (!next.some((item) => item.isDefault) \&\& next\[0]) {
      next\[0].isDefault = true;
    }

    await this.saveAll(next, 'migration');
    return next;
  }

  async delete(accountId: string): Promise<AccountCredential\[]> {
    const current = await this.loadAll();
    const next = current.filter((item) => item.id !== accountId);
    if (next.length > 0 \&\& !next.some((item) => item.isDefault)) {
      next\[0].isDefault = true;
    }
    await this.saveAll(next);
    return next;
  }

  async setEnabled(accountId: string, enabled: boolean): Promise<AccountCredential\[]> {
    const current = await this.loadAll();
    const next = current.map((item) => item.id === accountId ? { ...item, enabled, updatedAt: nowIso() } : item);
    await this.saveAll(next);
    return next;
  }

  async setDefault(accountId: string): Promise<AccountCredential\[]> {
    const current = await this.loadAll();
    const next = current.map((item) => ({
      ...item,
      isDefault: item.id === accountId,
      updatedAt: nowIso(),
    }));
    await this.saveAll(next);
    return next;
  }
}
