import type { LegacyAccountInput } from '../../core/types';
import { parseLegacyAccounts } from '../../utils/validators';

export class AccountValidator {
  validateLegacyArray(input: unknown): LegacyAccountInput\[] {
    return parseLegacyAccounts(input);
  }
}
