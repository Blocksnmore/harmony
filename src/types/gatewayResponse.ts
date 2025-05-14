import type { GatewayOpcodes, GatewayEvents } from './gateway.ts'

/**
 * Gateway response from Discord.
 *
 */
export interface GatewayResponse {
  op: GatewayOpcodes
  // untyped JSON
  d: unknown
  s?: number
  t?: GatewayEvents
}
