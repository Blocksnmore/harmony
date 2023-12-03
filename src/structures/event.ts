import { Base } from './base.ts'
import type { Client } from '../client/mod.ts'
import { EVENT_COVER, EVENT, EVENT_USERS } from '../types/endpoint.ts'
import {
  EventPayload,
  EventEntityMetadata,
  EventEntityType,
  EventPrivacyLevel,
  EventStatus
} from '../types/event.ts'
import { ImageSize } from '../types/cdn.ts'
import { ImageURL } from './cdn.ts'
import { Snowflake } from '../utils/snowflake.ts'
import type { UserPayload } from '../types/user.ts'

export default class Event extends Base {
  id!: string

  get snowflake(): Snowflake | null {
    return this.id === null ? null : new Snowflake(this.id)
  }

  get timestamp(): Date | null {
    return this.snowflake === null ? null : new Date(this.snowflake.timestamp)
  }

  constructor(client: Client, data: EventPayload) {
    super(client, data)
    this.readFromData(data)
  }

  guildID!: string
  channelID?: string
  // will only be null for events before Oct 25, 2021
  creatorID?: string
  name!: string
  description?: string
  startTime!: string
  endTime?: string
  privacyLevel!: EventPrivacyLevel
  status!: EventStatus
  entity_type!: EventEntityType
  entity_id?: string
  entity_metadata?: EventEntityMetadata
  // will only be null for events before Oct 25, 2021
  creator?: UserPayload
  userCount!: number
  image?: string

  readFromData(data: EventPayload): void {
    this.id = data.id
    this.guildID = data.guild_id ?? this.guildID
    this.channelID = data.channel_id ?? this.channelID
    this.creatorID = data.creator_id ?? this.creatorID
    this.name = data.name ?? this.name
    this.description = data.description ?? this.description
    this.startTime = data.scheduled_start_time ?? this.startTime
    this.endTime = data.scheduled_end_time ?? this.endTime
    this.privacyLevel = data.privacy_level ?? this.privacyLevel
    this.status = data.status ?? this.status
    this.entity_type = data.entity_type ?? this.entity_type
    this.entity_id = data.entity_id ?? this.entity_id
    this.entity_metadata = data.entity_metadata ?? this.entity_metadata
    this.creator = data.creator ?? this.creator
    this.userCount = data.user_count ?? this.userCount
    this.image = data.image ?? this.image
  }

  /**
   * Gets event cover image URL
   */
  eventCoverURL(
    format: 'png' | 'gif' | 'dynamic' = 'png',
    size: ImageSize = 512
  ): string | undefined {
    return this.image != null
      ? `${ImageURL(EVENT_COVER(this.id, this.image), format, size)}`
      : undefined
  }

  async delete(): Promise<void> {
	return this.client.rest.delete(EVENT(this.id))
  }
}
