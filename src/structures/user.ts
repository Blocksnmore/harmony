import type { Client } from '../client/mod.ts'
import type { UserPayload } from '../types/user.ts'
import { UserFlagsManager } from '../utils/userFlags.ts'
import { SnowflakeBase } from './base.ts'
import { ImageURL } from './cdn.ts'
import type { ImageSize, ImageFormats } from '../types/cdn.ts'
import { DEFAULT_USER_AVATAR, USER_AVATAR } from '../types/endpoint.ts'
import type { DMChannel } from './dmChannel.ts'
import type { AllMessageOptions } from './textChannel.ts'
import type { Message } from './message.ts'
import type { IResolvable } from './resolvable.ts'

export class User extends SnowflakeBase {
  override id: string
  username!: string
  displayName!: string
  discriminator!: string
  avatar?: string
  bot?: boolean
  system?: boolean
  mfaEnabled?: boolean
  locale?: string
  verified?: boolean
  email?: string
  flags!: UserFlagsManager
  /**
   * Nitro type of the User.
   *
   * 0 = No Nitro
   * 1 = Classic Nitro
   * 2 = Regular Nitro
   */
  premiumType?: 0 | 1 | 2
  publicFlags!: UserFlagsManager

  get tag(): string {
    return this.discriminator === '0'
      ? this.displayName
      : `${this.username}#${this.discriminator}`
  }

  get nickMention(): string {
    return `<@!${this.id}>`
  }

  get mention(): string {
    return `<@${this.id}>`
  }

  avatarURL(format: ImageFormats = 'png', size: ImageSize = 512): string {
    return this.avatar != null
      ? `${ImageURL(USER_AVATAR(this.id, this.avatar), format, size)}`
      : this.defaultAvatarURL
  }

  get defaultAvatarURL(): string {
    return `${DEFAULT_USER_AVATAR(String(Number(this.discriminator) % 5))}.png`
  }

  constructor(client: Client, data: UserPayload) {
    super(client, data)
    this.id = data.id
    this.readFromData(data)
  }

  readFromData(data: UserPayload): void {
    this.username = data.username ?? this.username
    this.displayName = data.global_name ?? this.displayName ?? this.username
    this.discriminator = data.discriminator ?? this.discriminator
    this.avatar = data.avatar ?? this.avatar
    this.bot = data.bot ?? this.bot
    this.system = data.system ?? this.system
    this.mfaEnabled = data.mfa_enabled ?? this.mfaEnabled
    this.locale = data.locale ?? this.locale
    this.verified = data.verified ?? this.verified
    this.email = data.email ?? this.email
    this.flags =
      data.flags !== undefined ? new UserFlagsManager(data.flags) : this.flags
    this.premiumType = data.premium_type ?? this.premiumType
    this.publicFlags =
      data.public_flags !== undefined
        ? new UserFlagsManager(data.public_flags)
        : this.publicFlags
  }

  override toString(): string {
    return this.mention
  }

  async createDM(): Promise<DMChannel> {
    return await this.client.createDM(this)
  }

  async resolveDM(): Promise<DMChannel> {
    const dmID = await this.client.channels.getUserDM(this.id)
    const dm =
      (dmID !== undefined
        ? await this.client.channels.get<DMChannel>(dmID)
        : undefined) ??
      (await this.createDM().then((chan) =>
        this.client.channels.setUserDM(this.id, chan.id).then(() => chan)
      ))
    return dm!
  }

  async send(
    content: string | AllMessageOptions,
    options?: AllMessageOptions
  ): Promise<Message> {
    const dm = await this.resolveDM()
    return dm.send(content, options)
  }
}

export class UserResolvable extends SnowflakeBase implements IResolvable<User> {
  constructor(client: Client, public override id: string) {
    super(client)
  }

  async get(): Promise<User | undefined> {
    return await this.client.users.get(this.id)
  }

  async fetch(): Promise<User> {
    return await this.client.users.fetch(this.id)
  }

  async resolve(): Promise<User | undefined> {
    return await this.client.users.resolve(this.id)
  }
}
