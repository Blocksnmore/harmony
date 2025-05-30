import { UserFlags } from '../types/userFlags.ts'
import { BitField, type BitFieldResolvable } from './bitfield.ts'

export class UserFlagsManager extends BitField {
  constructor(bits: BitFieldResolvable | undefined) {
    super(UserFlags, bits ?? 0)
  }
}
