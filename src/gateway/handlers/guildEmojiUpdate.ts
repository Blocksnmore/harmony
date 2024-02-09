import { Emoji } from '../../structures/emoji.ts'
import { Guild } from '../../structures/guild.ts'
import { GuildEmojiUpdatePayload } from '../../types/gateway.ts'
import type { Gateway, GatewayEventHandler } from '../mod.ts'

export const guildEmojiUpdate: GatewayEventHandler = async (
  gateway: Gateway,
  d: GuildEmojiUpdatePayload
) => {
  const guild: Guild | undefined = await gateway.client.guilds.get(d.guild_id)

  if (guild !== undefined) {
    const cachedEmojis = await guild.emojis.collection()
    const addedEmojis: Emoji[] = []
    const deletedEmojis: Emoji[] = []
    const updatedEmojis: Array<{ before: Emoji; after: Emoji }> = []

    for (const emote of d.emojis) {
      if (emote.user !== undefined)
        await gateway.client.users.set(emote.user.id, emote.user)

      if (emote.id === null) continue

      if (cachedEmojis.has(emote.id) === true) {
        const before = cachedEmojis.get(emote.id!)!
        if (
          before.name !== emote.name ||
          before.available !== emote.available
        ) {
          await guild.emojis.set(emote.id, emote)
          updatedEmojis.push({
            before,
            after: (await guild.emojis.get(emote.id))!
          })
        }
      } else {
        await guild.emojis.set(emote.id, emote)
        addedEmojis.push((await guild.emojis.get(emote.id))!)
      }
    }

    for (const [id, emoji] of cachedEmojis) {
      if (d.emojis.some((e) => e.id === id) === false) {
        deletedEmojis.push(emoji)
      }
    }

    if (deletedEmojis.length > 0) {
      // There's no way to access the internal delete which doesn't make a delete request for each emote
      await guild.emojis.flush()

      for (const emoji of d.emojis) {
        await guild.emojis.set(emoji.id!, emoji)
      }
    }

    for (const emoji of addedEmojis) {
      gateway.client.emit('guildEmojiAdd', emoji)
    }

    for (const emoji of deletedEmojis) {
      gateway.client.emit('guildEmojiDelete', emoji)
    }

    for (const emoji of updatedEmojis) {
      gateway.client.emit('guildEmojiUpdate', emoji.before, emoji.after)
    }

    gateway.client.emit('guildEmojisUpdate', guild)
  }
}
