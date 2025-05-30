import {
  Client,
  type Message,
  type Member,
  type GuildChannels,
  Embed,
  type Guild,
  type EveryChannelTypes,
  ChannelTypes,
  type GuildTextChannel,
  Permissions,
  Collector,
  MessageAttachment,
  OverrideType,
  ColorUtil,
  isGuildBasedTextChannel
} from '../mod.ts'
// import { TOKEN } from './config.ts'

const client = new Client({
  clientProperties: {
    browser: 'Discord iOS'
  },
  intents: [
    'GUILDS',
    'DIRECT_MESSAGES',
    'GUILD_MESSAGES',
    'GUILD_MEMBERS',
    'GUILD_PRESENCES'
  ]
  // cache: new RedisCacheAdapter({
  //   hostname: '127.0.0.1',
  //   port: 6379
  // }), // Defaults to in-memory Caching
  // shardCount: 2
})

client.interactions.handle('modal', async (i) =>
  i
    .reply({
      content: 'hi',
      files: [
        await MessageAttachment.load(
          'https://cdn.discordapp.com/emojis/827755526128402493.png',
          'file.png',
          'description'
        )
      ],
      ephemeral: true
    })
    .then((i) => i.fetchResponse())
    .then(console.log)
)

client.interactions.on('interactionError', console.error)

client.on('threadCreate', (t) => console.log('Thread Create', t))
client.on('threadDelete', (t) => console.log('Thread Delete', t))
client.on('threadDeleteUncached', (t) =>
  console.log('Thread Delete Uncached', t)
)

client.on('channelUpdate', (b: EveryChannelTypes, a: EveryChannelTypes) => {
  if (b.type === ChannelTypes.GUILD_TEXT) {
    const before = b as unknown as GuildTextChannel
    const after = a as unknown as GuildTextChannel
    before.send('', {
      embed: new Embed({
        title: 'Channel Update',
        description: `Name Before: ${before.name}\nName After: ${after.name}`
      })
    })
  }
})

client.on('messageCreate', async (msg: Message) => {
  if (msg.author.bot === true) return
  if (msg.stickerItems !== undefined) {
    console.log(
      `${msg.author.tag}: (Sticker)${msg.stickerItems.map(
        (sticker) => `Name: ${sticker.name}`
      )}`
    )
  } else {
    console.log(`${msg.author.tag}: ${msg.content}`)
  }
  if (msg.content === '!ping') {
    msg.reply(`Pong! Ping: ${client.gateway.ping}ms`)
  } else if (msg.content === '!fetchMessages') {
    await msg.channel.fetchMessages().then((e) => console.log(e.size))
  } else if (msg.content === '!audit') {
    console.log(await msg.guild!.fetchAuditLog())
    msg.reply('Check console for thicc json', {
      allowedMentions: { replied_user: false }
    })
  } else if (msg.content === '!reactions') {
    for (const e of ['😂', '😄', '🎉', '🙂', '🤦‍♂️', '👋', '👌', '🤞', '✋']) {
      await msg.addReaction(e)
    }
  } else if (msg.content === '!members') {
    const col = await msg.guild?.members.array()
    const data = col
      ?.map((c: Member, i: number) => {
        return `${i + 1}. ${c.user.tag}`
      })
      .join('\n') as string
    msg.channel.send('Member List:\n' + data)
  } else if (msg.content === '!guilds') {
    const guilds = await msg.client.guilds.collection()
    msg.channel.send(
      'Guild List:\n' +
        (guilds
          .array()
          .map((c: Guild, i: number) => {
            return `${i + 1}. ${c.name} - ${c.memberCount} members`
          })
          .join('\n') as string)
    )
  } else if (msg.content === '!channels') {
    const col = await msg.guild?.channels.array()
    const data = col
      ?.map((c: GuildChannels, i: number) => {
        return `${i + 1}. ${c.name}`
      })
      .join('\n') as string
    msg.channel.send('Channels List:\n' + data)
  } else if (msg.content === '!messages') {
    const col = await msg.channel.messages.array()
    const data = col
      ?.slice(-5)
      .map((c: Message, i: number) => {
        return `${i + 1}. ${c.content}`
      })
      .join('\n') as string
    msg.channel.send('Top 5 Message List:\n' + data)
  } else if (msg.content === '!editChannel') {
    const channel = msg.channel as GuildTextChannel
    const newChannel = await channel.edit({
      name: 'gggg'
    })
    if (newChannel.name === 'gggg') {
      msg.channel.send('Done!')
    } else {
      msg.channel.send('Failed...')
    }
  } else if (msg.content === '!react') {
    msg.addReaction('a:programming:785013658257195008')
  } else if (msg.content === '!wait_for') {
    msg.channel.send('Send anything!')
    const [receivedMsg] = await client.waitFor(
      'messageCreate',
      (message) => message.author.id === msg.author.id
    )

    msg.channel.send(`Received: ${receivedMsg?.content}`)
  } else if (msg.content.startsWith('!collect') === true) {
    let count = parseInt(msg.content.replace(/\D/g, ''))
    if (isNaN(count)) count = 5
    await msg.channel.send(`Collecting ${count} messages for 5s`)
    const coll = new Collector({
      event: 'messageCreate',
      filter: (m) => m.author.id === msg.author.id,
      deinitOnEnd: true,
      max: count,
      timeout: 5000
    })
    coll.init(client)
    coll.collect()
    coll.on('start', () => msg.channel.send('[COL] Started'))
    coll.on('end', () =>
      msg.channel.send(`[COL] Ended. Collected Size: ${coll.collected.size}`)
    )
    coll.on('collect', (msg) =>
      msg.channel.send(`[COL] Collect: ${msg.content}`)
    )
  } else if (msg.content === '!attach') {
    msg.channel.send({
      files: [
        await MessageAttachment.load(
          'https://cdn.discordapp.com/emojis/626139395623354403.png?v=1',
          'very_emoji.png',
          'much description'
        ),
        await MessageAttachment.load(
          'https://cdn.discordapp.com/emojis/626139395623354403.png?v=1',
          'test2.png',
          'yes'
        )
      ]
    })
  } else if (msg.content === '!emattach') {
    msg.channel.send(
      new Embed()
        .attach(
          await MessageAttachment.load(
            'https://cdn.discordapp.com/emojis/626139395623354403.png?v=1',
            'file1.png'
          ),
          await MessageAttachment.load(
            'https://cdn.discordapp.com/emojis/626139395623354403.png?v=1',
            'file2.png'
          )
        )
        .setImage('attachment://file1.png')
        .setThumbnail('attachment://file2.png')
    )
  } else if (msg.content === '!textfile') {
    msg.channel.send({
      files: [
        new MessageAttachment('hello.txt', 'world'),
        new MessageAttachment('world.txt', 'hello')
      ]
    })
  } else if (msg.content === '!join') {
    if (msg.member === undefined) return
    const vs = await msg.guild?.voiceStates.get(msg.member.id)
    if (typeof vs !== 'object') return
    vs.channel?.join()
  } else if (msg.content === '!getOverwrites') {
    if (!isGuildBasedTextChannel(msg.channel)) {
      return msg.channel.send("This isn't a guild text channel!")
    }
    const overwrites = await (msg.channel as GuildTextChannel).overwritesFor(
      msg.member as Member
    )
    msg.channel.send(
      `Your permission overwrites:\n${overwrites
        .map(
          (over) =>
            `ID: ${over.id}\nAllowed:\n${over.allow
              .toArray()
              .join('\n')}\nDenied:\n${over.deny.toArray().join('\n')}`
        )
        .join('\n\n')}`
    )
  } else if (msg.content === '!perms') {
    if (msg.channel.type !== ChannelTypes.GUILD_TEXT) {
      return msg.channel.send("This isn't a guild text channel!")
    }
    const permissions = await (
      msg.channel as unknown as GuildTextChannel
    ).permissionsFor(msg.member as Member)
    msg.channel.send(`Your permissions:\n${permissions.toArray().join('\n')}`)
  } else if (msg.content === '!addBasicOverwrites') {
    if (!isGuildBasedTextChannel(msg.channel)) {
      return msg.channel.send("This isn't a guild text channel!")
    }
    if (msg.member !== undefined) {
      await msg.channel.addOverwrite({
        id: msg.member,
        allow: Permissions.DEFAULT.toString()
      })
      msg.channel.send(`Done!`)
    }
  } else if (msg.content === '!updateBasicOverwrites') {
    if (!isGuildBasedTextChannel(msg.channel)) {
      return msg.channel.send("This isn't a guild text channel!")
    }
    if (msg.member !== undefined) {
      await msg.channel.editOverwrite(
        {
          id: msg.member,
          allow: Permissions.DEFAULT.toString()
        },
        {
          allow: OverrideType.REMOVE
        }
      )
      msg.channel.send(`Done!`)
    }
  } else if (msg.content === '!addAllRoles') {
    const roles = await msg.guild?.roles.array()
    if (roles !== undefined) {
      roles.forEach(async (role) => {
        await msg.member?.roles.add(role)
        console.log(role)
      })
    }
  } else if (msg.content === '!createAndAddRole') {
    if (msg.guild !== undefined) {
      const role = await msg.guild.roles.create({
        name: 'asdf',
        permissions: 0
      })
      await msg.member?.roles.add(role)
    }
  } else if (msg.content === '!roles') {
    let buf = 'Roles:'
    if (msg.member === undefined) return
    for await (const role of msg.member.roles) {
      buf += `\n${role.name === '@everyone' ? 'everyone' : role.name}`
    }
    msg.reply(buf)
  } else if (msg.content === '!addrole') {
    msg.member?.roles.add('837255383759716362')
  } else if (msg.content === '!dm') {
    console.log('wtf')
    msg.author.send('UwU').then((m) => {
      msg.reply(`Done, ${m.id}`)
    })
  } else if (msg.content === '!timer') {
    msg.channel.send('3...').then((msg) => {
      setTimeout(() => {
        msg.edit('2...').then((msg) => {
          setTimeout(() => {
            msg.edit('1...').then((msg) => {
              setTimeout(() => {
                msg.edit('ok wut')
              }, 1000)
            })
          }, 1000)
        })
      }, 1000)
    })
  } else if (msg.content === '!pin') {
    await msg.pinMessage()
    msg.channel.send('Done!')
  } else if (msg.content.startsWith('!unpin') === true) {
    const [, ...ids] = msg.content.split(' ')
    if (ids.length === 0) {
      msg.channel.send('Please specify a message ID!')
      return
    }

    for (const id of ids) {
      await msg.channel.unpinMessage(id)
    }

    msg.channel.send('Done!')
  } else if (msg.content === '!getPins') {
    const pins = await msg.channel.getPinnedMessages()
    msg.channel.send(`Pinned messages: ${pins.map((pin) => pin.id).join('\n')}`)
  } else if (msg.content === '!avatar') {
    if (msg.member !== undefined) {
      msg.channel.send(msg.member.avatarURL())
    } else {
      msg.channel.send(msg.author.avatarURL())
    }
  } else if (msg.content.startsWith('!roleIcon') === true) {
    const size = msg.mentions.roles.size
    const role = msg.mentions.roles.first()
    const icon = role?.roleIcon()
    if (size === 0) {
      msg.channel.send('no role mentioned')
    } else {
      if (icon === undefined) {
        msg.channel.send('no icon')
      } else {
        msg.channel.send(icon)
      }
    }
  } else if (msg.content === '!roleSmile') {
    const role = await msg.guild?.roles.get('834440844270501888')
    if (role !== undefined) {
      role.edit({ unicodeEmoji: '😀' })
    }
  } else if (msg.content === '!color') {
    msg.channel.send(
      msg.member !== undefined
        ? ColorUtil.intToHex(await msg.member.effectiveColor())
        : 'not in a guild'
    )
  } else if (msg.content === '!presence') {
    if (msg.guild === undefined) return
    const presence = await msg.guild.presences.resolve(msg.author.id)
    msg.reply(`Status: ${presence?.status}`)
  }
})

client.on('messageReactionRemove', (reaction) => {
  const msg = reaction.message

  if (reaction.me && reaction.emoji.getEmojiString === '🤔') {
    msg.removeReaction(reaction.emoji)
  }
})

await client.connect()
console.log(`[Login] Logged in as ${client.user?.tag}!`)

// OLD: Was a way to reproduce reconnect infinite loop
// setTimeout(() => {
//   console.log('[DEBUG] Reconnect')
//   client.gateway?.reconnect()
// }, 1000 * 4)
