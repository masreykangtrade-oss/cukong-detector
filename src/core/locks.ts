export class KeyedLock {
  private readonly active = new Set<string>();

  async withKey<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.active.has(key)) {
      throw new Error(`Lock aktif untuk key: ${key}`);
    }

    this.active.add(key);
    try {
      return await fn();
    } finally {
      this.active.delete(key);
    }
  }

  isLocked(key: string): boolean {
    return this.active.has(key);
  }
}
