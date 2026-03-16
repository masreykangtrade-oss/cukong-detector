import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export class JsonStore<T> {
  constructor(
    private readonly filePath: string,
    private readonly fallback: T,
  ) {}

  getPath(): string {
    return this.filePath;
  }

  async read(): Promise<T> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      return JSON.parse(raw) as T;
    } catch (error) {
      const isMissing = (error as NodeJS.ErrnoException).code === 'ENOENT';
      if (isMissing) {
        await this.write(this.fallback);
        return this.fallback;
      }
      throw error;
    }
  }

  async write(data: T): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}
