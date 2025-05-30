import type { Client } from '../client/mod.ts'
import {
  ChannelTypes,
  type ThreadChannelPayload,
  type ThreadMemberPayload
} from '../types/channel.ts'
import type { ThreadChannel } from '../structures/threadChannel.ts'
import { BaseChildManager } from './baseChild.ts'
import type { GuildChannelsManager } from './guildChannels.ts'
import type { BaseManager } from './base.ts'

export const ThreadTypes = [
  ChannelTypes.NEWS_THREAD,
  ChannelTypes.PRIVATE_THREAD,
  ChannelTypes.PUBLIC_THREAD
]

export class ThreadsManager extends BaseChildManager<
  ThreadChannelPayload,
  ThreadChannel
> {
  constructor(client: Client, parent: GuildChannelsManager) {
    // it's not assignable but we're making sure it returns correct type
    // so i had to make ts to shut up
    super(
      client,
      parent as unknown as BaseManager<ThreadChannelPayload, ThreadChannel>
    )
  }

  override async set(
    id: string,
    data: ThreadChannelPayload & { members?: ThreadMemberPayload[] }
  ): Promise<void> {
    if ('members' in data) {
      for (const member of data.members as ThreadMemberPayload[]) {
        await this.client.cache.set(`thread_members:${id}`, member.id, member)
      }
      data.members = undefined
    }
    await super.set(id, data)
  }

  override async get(id: string): Promise<ThreadChannel | undefined> {
    const res = await this.parent.get(id)
    if (res === undefined || !ThreadTypes.includes(res.type)) return undefined
    else return res
  }

  override async array(): Promise<ThreadChannel[]> {
    const arr = await this.parent.array()
    return arr.filter((e) => ThreadTypes.includes(e.type))
  }
}
