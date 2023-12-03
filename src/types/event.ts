import type { UserPayload } from './user.ts'

export interface EventPayload {
  id: string
  guild_id: string
  channel_id: string | null
  // will only be null for events before Oct 25, 2021
  creator_id: string | null
  name: string
  description: string | null
  scheduled_start_time: string
  scheduled_end_time: string | null
  privacy_level: EventPrivacyLevel
  status: EventStatus
  entity_type: EventEntityType
  entity_id: string | null
  entity_metadata: EventEntityMetadata | null
  // will only be null for events before Oct 25, 2021
  creator: UserPayload | null
  user_count: number
  image: string | null
}

export enum EventPrivacyLevel {
  GUILD_ONLY = 2
}

export enum EventStatus {
  SCHEDULED = 1,
  ACTIVE = 2,
  COMPLETED = 3,
  CANCELED = 4
}

export enum EventEntityType {
  STAGE_INSTANCE = 1,
  VOICE = 2,
  EXTERNAL = 3
}

export interface EventEntityMetadata {
  location: string | null
}
