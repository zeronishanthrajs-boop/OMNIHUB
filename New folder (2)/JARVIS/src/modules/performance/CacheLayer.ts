import { openDB, type DBSchema, type IDBPDatabase } from "idb";

interface JarvisCacheSchema extends DBSchema {
  responses: {
    key: string;
    value: { value: string; expiresAt: number; lastUsed: number };
  };
}

export class CacheLayer {
  private dbPromise: Promise<IDBPDatabase<JarvisCacheSchema>> | null = null;
  private readonly memory = new Map<string, { value: string; expiresAt: number; lastUsed: number }>();

  constructor(
    private readonly ttlMs = 60 * 60 * 1000,
    private readonly maxEntries = 200
  ) {}

  async get(key: string): Promise<string | null> {
    if (!("indexedDB" in globalThis)) {
      const item = this.memory.get(this.normalize(key));
      if (!item || item.expiresAt < Date.now()) return null;
      item.lastUsed = Date.now();
      return item.value;
    }
    const db = await this.db();
    const item = await db.get("responses", this.normalize(key));
    if (!item || item.expiresAt < Date.now()) {
      return null;
    }
    await db.put("responses", { ...item, lastUsed: Date.now() }, this.normalize(key));
    return item.value;
  }

  async set(key: string, value: string): Promise<void> {
    if (!("indexedDB" in globalThis)) {
      this.memory.set(this.normalize(key), { value, expiresAt: Date.now() + this.ttlMs, lastUsed: Date.now() });
      return;
    }
    const db = await this.db();
    await db.put(
      "responses",
      { value, expiresAt: Date.now() + this.ttlMs, lastUsed: Date.now() },
      this.normalize(key)
    );
    await this.evict(db);
  }

  private async db(): Promise<IDBPDatabase<JarvisCacheSchema>> {
    this.dbPromise ??= openDB<JarvisCacheSchema>("jarvis-cache", 1, {
      upgrade(db) {
        db.createObjectStore("responses");
      }
    });
    return this.dbPromise;
  }

  private async evict(db: IDBPDatabase<JarvisCacheSchema>): Promise<void> {
    const keys = await db.getAllKeys("responses");
    if (keys.length <= this.maxEntries) {
      return;
    }
    const entries = await Promise.all(keys.map(async (key) => ({ key, value: await db.get("responses", key) })));
    const sorted = entries
      .filter((entry): entry is { key: string; value: { value: string; expiresAt: number; lastUsed: number } } => Boolean(entry.value))
      .sort((a, b) => a.value.lastUsed - b.value.lastUsed);
    for (const entry of sorted.slice(0, keys.length - this.maxEntries)) {
      await db.delete("responses", entry.key);
    }
  }

  private normalize(key: string): string {
    return key.trim().toLowerCase().replace(/\s+/g, " ");
  }
}
