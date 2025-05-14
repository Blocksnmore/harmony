import type { Client } from '../client/mod.ts'
import { Base } from '../structures/base.ts'
import { Collection } from '../utils/collection.ts'
import type { BaseManager } from './base.ts'

/** Child Managers validate data from their parents i.e. from Managers */
export class BaseChildManager<T, T2> extends Base {
  /** Parent Manager */
  parent: BaseManager<T, T2>

  constructor(client: Client, parent: BaseManager<T, T2>) {
    super(client)
    this.parent = parent
  }

  get cacheName(): string {
    return typeof this.parent === 'undefined'
      ? 'unknown_parent'
      : this.parent.cacheName
  }

  async get(key: string): Promise<T2 | undefined> {
    return await this.parent.get(key)
  }

  async set(key: string, value: T): Promise<void> {
    return await this.parent.set(key, value)
  }

  async delete(_: string): Promise<boolean> {
    return await false
  }

  async array(): Promise<T2[]> {
    return await this.parent.array()
  }

  async collection(): Promise<Collection<string, T2>> {
    const arr = (await this.array()) as undefined | T2[]
    if (arr === undefined) return new Collection()
    const collection = new Collection()
    for (const elem of arr) {
      collection.set((elem as unknown as { id: string }).id, elem)
    }
    return collection as Collection<string, T2>
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<T2> {
    for (const data of (await this.array()) ?? []) {
      yield data
    }
  }

  async fetch(...args: unknown[]): Promise<T2 | undefined> {
    return await this.parent.fetch(...args)
  }

  /** Try to get value from cache, if not found then fetch */
  async resolve(key: string): Promise<T2 | undefined> {
    const cacheValue = await this.get(key)
    if (cacheValue !== undefined) return cacheValue
    else {
      const fetchValue = await this.fetch(key).catch(() => undefined)
      if (fetchValue !== undefined) return fetchValue
    }
  }

  /** Gets number of values stored in Cache */
  async size(): Promise<number> {
    return await this.parent.size()
  }

  async keys(): Promise<string[]> {
    return await this.parent.keys()
  }

  [Symbol.for('Deno.customInspect')](): string {
    return `ChildManager(${this.cacheName})`
  }
}
