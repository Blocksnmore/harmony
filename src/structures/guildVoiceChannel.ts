import type { Client } from '../client/mod.ts'
import type {
  GuildVoiceChannelPayload,
  ModifyVoiceChannelOption,
  ModifyVoiceChannelPayload
} from '../types/channel.ts'
import { CHANNEL } from '../types/endpoint.ts'
import { GuildChannel } from './channel.ts'
import type { Guild } from './guild.ts'
import { GuildChannelVoiceStatesManager } from '../managers/guildChannelVoiceStates.ts'
import type { User } from './user.ts'
import type { Member } from './member.ts'
import type {
  VoiceChannelJoinOptions,
  VoiceServerData
} from '../client/voice.ts'
import { Mixin } from '../../deps.ts'
import { TextChannel } from './textChannel.ts'

const VoiceChannelSuper: (abstract new (
  client: Client,
  data: GuildVoiceChannelPayload,
  guild: Guild
) => TextChannel & GuildChannel) &
  Pick<typeof TextChannel, keyof typeof TextChannel> &
  Pick<typeof GuildChannel, keyof typeof GuildChannel> = Mixin(
  TextChannel,
  GuildChannel
)

export class VoiceChannel extends VoiceChannelSuper {
  bitrate!: string
  userLimit!: number
  voiceStates: GuildChannelVoiceStatesManager =
    new GuildChannelVoiceStatesManager(
      this.client,
      this.guild.voiceStates,
      this
    )

  constructor(client: Client, data: GuildVoiceChannelPayload, guild: Guild) {
    super(client, data, guild)
    this.readFromData(data)
  }

  /** Join the Voice Channel */
  async join(options?: VoiceChannelJoinOptions): Promise<VoiceServerData> {
    return await this.client.voice.join(this.id, options)
  }

  /** Leave the Voice Channel */
  async leave(): Promise<void> {
    return await this.client.voice.leave(this.guild)
  }

  override readFromData(data: GuildVoiceChannelPayload): void {
    super.readFromData(data)
    this.bitrate = data.bitrate ?? this.bitrate
    this.userLimit = data.user_limit ?? this.userLimit
  }

  override async edit(
    options?: ModifyVoiceChannelOption
  ): Promise<VoiceChannel> {
    const body: ModifyVoiceChannelPayload = {
      name: options?.name,
      position: options?.position,
      permission_overwrites: options?.permissionOverwrites,
      parent_id: options?.parentID,
      bitrate: options?.bitrate,
      user_limit: options?.userLimit
    }

    const resp = await this.client.rest.patch(CHANNEL(this.id), body)

    return new VoiceChannel(
      this.client,
      resp as GuildVoiceChannelPayload,
      this.guild
    )
  }

  async setBitrate(rate: number | undefined): Promise<VoiceChannel> {
    return await this.edit({ bitrate: rate })
  }

  async setUserLimit(limit: number | undefined): Promise<VoiceChannel> {
    return await this.edit({ userLimit: limit })
  }

  async disconnectMember(
    member: User | Member | string
  ): Promise<Member | undefined> {
    const memberID = typeof member === 'string' ? member : member.id
    const memberVoiceState = await this.voiceStates.get(memberID)

    return memberVoiceState?.disconnect()
  }

  async disconnectAll(): Promise<Member[]> {
    const members: Member[] = []
    for await (const memberVoiceState of this.voiceStates) {
      const member = await memberVoiceState.disconnect()
      if (member !== undefined) {
        members.push(member)
      }
    }

    return members
  }
}
