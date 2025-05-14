import * as discord from '../mod.ts'
import { TOKEN2 } from './config.ts'

const client = new discord.Client({
  intents: ['GUILDS'],
  token: TOKEN2,
  shardCount: 20
})

client.on('shardReady', (shard) => {
  console.log(`Shard ${shard} ready!`)
})

client.once('ready', (shards) => {
  console.log(`Launched ${shards} shards! Time: ${performance.now() - started}`)
})

console.log('Connecting...')

const started = performance.now()
client.connect()
