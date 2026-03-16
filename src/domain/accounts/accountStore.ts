import path from 'node:path';
import { env } from '../../config/env';
import type { AccountCredential, AccountsMeta, LegacyAccountInput } from '../../core/types';
import { JsonStore } from '../../storage/jsonStore';
import { nowIso } from '../../utils/time';
import {
  validateAccountList,
  validateLegacyAccountInput,
} from './accountValidator';

function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'account';
}

function createAccountId(name: string): string {
  return `${slugifyName(name)}-${Date.now()}`;
}

function ensureSingleDefault(accounts: AccountCredential[]): AccountCredential[] {
  if (accounts.length === 0) {
    return accounts;
  }

  let foundDefault = false;

  const normalized = accounts.map((item, index) => {
    if (item.isDefault && !foundDefault) {
      foundDefault = true;
      return item;
    }

    return {
      ...item,
      isDefault: false,
    };
  });

  if (!foundDefault) {
    normalized[0] = {
      ...normalized[0],
      isDefault: true,
    };
  }

  return normalized;
}

export class AccountStore {
  private readonly accountsStore = new JsonStore<AccountCredential[]>(env.accountsFile, []);
  private readonly metaStore = new JsonStore<AccountsMeta>(
    path.resolve(env.dataDir, 'accounts-meta.json'),
    {
      lastUpdatedAt: null,
      defaultAccountId: null,
      source: 'manual',
      totalAccounts: 0,
    },
  );

  getFilePath(): string {
    return this.accountsStore.getPath();
  }

  async loadAll(): Promise<AccountCredential[]> {
    const raw = await this.accountsStore.read();
    return validateAccountList(ensureSingleDefault(raw));
  }

  async loadMeta(): Promise<AccountsMeta> {
    return this.metaStore.read();
  }

  async saveAll(
    accounts: AccountCredential[],
    source: AccountsMeta['source'] = 'manual',
  ): Promise<AccountCredential[]> {
    const normalized = validateAccountList(ensureSingleDefault(accounts));
    await this.accountsStore.write(normalized);

    const defaultAccount = normalized.find((item) => item.isDefault) ?? null;

    await this.metaStore.write({
      lastUpdatedAt: nowIso(),
      defaultAccountId: defaultAccount?.id ?? null,
      source,
      totalAccounts: normalized.length,
    });

    return normalized;
  }

  async saveLegacyUpload(input: unknown): Promise<AccountCredential[]> {
    const parsed = validateLegacyAccountInput(input);
    return this.replaceFromLegacy(parsed, 'telegram_upload');
  }

  async replaceFromLegacy(
    items: LegacyAccountInput[],
    source: AccountsMeta['source'] = 'manual',
  ): Promise<AccountCredential[]> {
    const parsed = validateLegacyAccountInput(items);
    const now = nowIso();

    const accounts: AccountCredential[] = parsed.map((item, index) => ({
      id: createAccountId(item.name),
      name: item.name.trim(),
      apiKey: item.apiKey.trim(),
      apiSecret: item.apiSecret.trim(),
      enabled: true,
      isDefault: index === 0,
      createdAt: now,
      updatedAt: now,
    }));

    return this.saveAll(accounts, source);
  }

  async upsertLegacyAccounts(items: LegacyAccountInput[]): Promise<AccountCredential[]> {
    const incoming = validateLegacyAccountInput(items);
    const current = await this.loadAll();
    const now = nowIso();

    const currentByName = new Map(
      current.map((item) => [item.name.trim().toLowerCase(), item] as const),
    );

    const next: AccountCredential[] = incoming.map((item, index) => {
      const existing = currentByName.get(item.name.trim().toLowerCase());

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

    return this.saveAll(next, 'migration');
  }

  async delete(accountId: string): Promise<AccountCredential[]> {
    const current = await this.loadAll();
    const next = current.filter((item) => item.id !== accountId);
    return this.saveAll(next, 'manual');
  }

  async setEnabled(accountId: string, enabled: boolean): Promise<AccountCredential[]> {
    const current = await this.loadAll();

    const next = current.map((item) =>
      item.id === accountId
        ? {
            ...item,
            enabled,
            updatedAt: nowIso(),
          }
        : item,
    );

    return this.saveAll(next, 'manual');
  }

  async setDefault(accountId: string): Promise<AccountCredential[]> {
    const current = await this.loadAll();

    if (!current.some((item) => item.id === accountId)) {
      throw new Error(`Account dengan id "${accountId}" tidak ditemukan.`);
    }

    const next = current.map((item) => ({
      ...item,
      isDefault: item.id === accountId,
      updatedAt: nowIso(),
    }));

    return this.saveAll(next, 'manual');
  }
}
