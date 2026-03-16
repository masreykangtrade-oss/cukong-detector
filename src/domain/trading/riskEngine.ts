import type { AccountCredential, BotSettings, RuntimePosition, SignalCandidate } from '../../core/types';

export class RiskEngine {
  assertCanEnter(input: {
    account: AccountCredential;
    settings: BotSettings;
    signal: SignalCandidate;
    positions: RuntimePosition\[];
    amountIdr: number;
    pairCooldownUntil?: string | null;
  }): void {
    const { account, settings, signal, positions, amountIdr, pairCooldownUntil } = input;

    if (!account.enabled) {
      throw new Error('Account nonaktif');
    }
    if (signal.score < settings.strategy.scoreAutoEntryThreshold \&\& settings.tradingMode === 'FULL\_AUTO') {
      throw new Error('Score di bawah auto-entry threshold');
    }
    if (signal.ticker.spreadPct > settings.risk.maxSpreadPct) {
      throw new Error('Spread melebihi batas risiko');
    }
    if (signal.ticker.liquidityScore < settings.risk.minLiquidityScore) {
      throw new Error('Likuiditas pair tidak memenuhi minimum');
    }
    if (amountIdr > settings.risk.maxModalPerTrade) {
      throw new Error('Nominal melebihi max modal per trade');
    }
    if (positions.filter((item) => item.status === 'open').length >= settings.risk.maxActivePositionsTotal) {
      throw new Error('Melebihi max active positions total');
    }
    if (positions.filter((item) => item.status === 'open' \&\& item.accountId === account.id).length >= settings.risk.maxActivePositionsPerAccount) {
      throw new Error('Melebihi max active positions per account');
    }
    if (positions.filter((item) => item.status === 'open' \&\& item.pair === signal.pair).length >= settings.risk.maxExposurePerPair) {
      throw new Error('Exposure per pair sudah penuh');
    }
    if (pairCooldownUntil \&\& new Date(pairCooldownUntil).getTime() > Date.now()) {
      throw new Error('Pair masih cooldown');
    }
  }

  evaluateExit(position: RuntimePosition): { shouldExit: boolean; reason?: RuntimePosition\['exitReason'] } {
    if (position.status !== 'open') {
      return { shouldExit: false };
    }

    const changePct = position.entryPrice > 0 ? ((position.lastMarkPrice - position.entryPrice) / position.entryPrice) \* 100 : 0;
    if (changePct <= -Math.abs(position.stopLossPct)) {
      return { shouldExit: true, reason: 'stop\_loss' };
    }
    if (changePct >= Math.abs(position.takeProfitPct)) {
      return { shouldExit: true, reason: 'take\_profit' };
    }
    const heldMs = Date.now() - new Date(position.openedAt).getTime();
    if (heldMs >= position.maxHoldMinutes \* 60\_000) {
      return { shouldExit: true, reason: 'max\_hold' };
    }
    return { shouldExit: false };
  }
}
