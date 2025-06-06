import { Collection } from '../utils/collection.ts'
import { Command } from './command.ts'
import type { CommandClient } from './client.ts'
import type { ClientEvents } from '../gateway/handlers/mod.ts'
import { join, walk } from '../../deps.ts'

// Breaking change if we change to unknown
export type ExtensionEventCallback = (
  ext: Extension,
  ...args: unknown[]
) => unknown

/** Extension Commands Manager */
export class ExtensionCommands {
  extension: Extension

  constructor(ext: Extension) {
    this.extension = ext
  }

  /** Gets a list of Extension's Commands */
  get list(): Collection<string, Command> {
    return this.extension.client.commands.list.filter(
      (c) => c.extension?.name === this.extension.name
    )
  }

  /** Gets an Extension Command */
  get(cmd: string): Command | undefined {
    const find = this.extension.client.commands.find(cmd)
    // linter sucks
    if (find === undefined) return undefined
    else if (find.extension === undefined) return undefined
    else if (find.extension.name !== this.extension.name) return undefined
    else return find
  }

  /** Adds an Extension Command */
  add(Cmd: Command | typeof Command): boolean {
    const cmd = Cmd instanceof Command ? Cmd : new Cmd()
    cmd.extension = this.extension
    return this.extension.client.commands.add(cmd)
  }

  /** Deletes an Extension Command */
  delete(cmd: Command | string): boolean {
    const find = this.extension.client.commands.find(
      typeof cmd === 'string' ? cmd : cmd.name
    )
    if (find === undefined) return false
    if (
      find.extension !== undefined &&
      find.extension.name !== this.extension.name
    )
      return false
    else return this.extension.client.commands.delete(find)
  }

  /** Deletes all Commands of an Extension */
  deleteAll(): void {
    for (const [cmd] of this.list) {
      this.delete(cmd)
    }
  }
}

/** Customizable, isolated and pluggable Extensions are a great way of writing certain Modules independent of others */
export class Extension {
  client: CommandClient
  /** Name of the Extension */
  name: string = ''
  /** Description of the Extension */
  description?: string
  /** Extensions's Commands Manager */
  commands: ExtensionCommands = new ExtensionCommands(this)
  /** Sub-Prefix to be used for ALL of Extension's Commands. */
  subPrefix?: string
  /** Events registered by this Extension */
  events: { [name: string]: (...args: unknown[]) => unknown } = {}

  constructor(client: CommandClient) {
    this.client = client
    const self = this as Extension & {
      _decoratedCommands?: Command[]
      _decoratedEvents?: { [name: string]: () => void }
    }
    if (self._decoratedCommands !== undefined) {
      Object.entries(self._decoratedCommands).forEach((entry) => {
        entry[1].extension = this
        this.commands.add(entry[1])
      })
      self._decoratedCommands = undefined
    }

    if (
      self._decoratedEvents !== undefined &&
      Object.keys(self._decoratedEvents).length !== 0
    ) {
      Object.entries(self._decoratedEvents).forEach((entry) => {
        this.listen(entry[0] as keyof ClientEvents, entry[1].bind(this))
      })
      self._decoratedEvents = undefined
    }
  }

  /** Listens for an Event through Extension. */
  listen(event: keyof ClientEvents, cb: ExtensionEventCallback): boolean {
    if (this.events[event] !== undefined) return false
    else {
      const fn = (...args: unknown[]): void => {
        cb(this, ...args)
      }
      this.client.on(event, fn)
      this.events[event] = fn
      return true
    }
  }

  /** Method called upon loading of an Extension */
  load(): unknown | Promise<unknown> {
    return
  }

  /** Method called upon unloading of an Extension */
  unload(): unknown | Promise<unknown> {
    return
  }
}

/** Extensions Manager for CommandClient */
export class ExtensionsManager {
  client: CommandClient
  list: Collection<string, Extension> = new Collection()

  constructor(client: CommandClient) {
    this.client = client
  }

  /** Gets an Extension by name */
  get(ext: string): Extension | undefined {
    return this.list.get(ext)
  }

  /** Checks whether an Extension exists or not */
  exists(ext: string): boolean {
    return this.get(ext) !== undefined
  }

  /** Loads an Extension onto Command Client */
  load(ext: Extension | typeof Extension): void {
    if (!(ext instanceof Extension)) ext = new ext(this.client)
    if (this.exists(ext.name))
      throw new Error(`Extension with name '${ext.name}' already exists`)
    this.list.set(ext.name, ext)
    ext.load()
  }

  /**
   * Load extensions from a Directory.
   *
   * NOTE: Relative paths resolve from cwd
   *
   * @param path Path of the directory.
   * @param options Options to configure loading.
   */
  async loadDirectory(
    path: string,
    options?: {
      exportName?: string
      maxDepth?: number
      exts?: string[]
      onlyRead?: boolean
    }
  ): Promise<Extension[]> {
    const extensions: Extension[] = []

    for await (const entry of walk(path, {
      maxDepth: options?.maxDepth,
      exts: options?.exts,
      includeDirs: false
    })) {
      if (entry.isFile !== true) continue
      const ext = (await import('file:///' + join(Deno.cwd(), entry.path)))[
        options?.exportName ?? 'default'
      ]

      extensions.push(ext)
      if (options?.onlyRead !== true) this.load(ext)
    }

    return extensions
  }

  /** Unloads an Extension from Command Client */
  unload(ext: Extension | string): boolean {
    const name = typeof ext === 'string' ? ext : ext.name
    const extension = this.get(name)
    if (extension === undefined) return false
    extension.commands.deleteAll()
    for (const [k, v] of Object.entries(extension.events)) {
      this.client.off(k as keyof ClientEvents, v)
      delete extension.events[k]
    }
    extension.unload()
    return this.list.delete(name)
  }
}
