import type {
  BotSettings,
  PositionRecord,
  RiskCheckResult,
  SignalCandidate,
  StoredAccount,
} from '../../core/types';

export interface RiskEntryCheckInput {
  account: StoredAccount;
  settings: BotSettings;
  signal: SignalCandidate;
  openPositions: PositionRecord[];
  amountIdr: number;
  cooldownUntil?: number | null;
}

export interface ExitDecision {
  shouldExit: boolean;
  reason?: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP';
}

function pctChange(from: number, to: number): number {
  if (from <= 0) {
    return 0;
  }

  return ((to - from) / from) * 100;
}

export class RiskEngine {
  checkCanEnter(input: RiskEntryCheckInput): RiskCheckResult {
    const reasons: string[] = [];
    const warnings: string[] = [];

    if (!input.account.enabled) {
      reasons.push('Account nonaktif');
    }

    if (input.signal.score < input.settings.strategy.minScoreToBuy) {
      reasons.push('Score di bawah minimum buy');
    }

    if (input.signal.confidence < input.settings.strategy.minConfidence) {
      reasons.push('Confidence di bawah minimum');
    }

    if (input.signal.spreadPct > input.settings.risk.maxPairSpreadPct) {
      reasons.push('Spread pair melebihi batas risiko');
    }

    if (input.amountIdr > input.settings.risk.maxPositionSizeIdr) {
      reasons.push('Ukuran posisi melebihi batas');
    }

    if (input.openPositions.length >= input.settings.risk.maxOpenPositions) {
      reasons.push('Jumlah posisi terbuka mencapai batas');
    }

    const samePairOpen = input.openPositions.some((item) => item.pair === input.signal.pair);
    if (samePairOpen) {
      reasons.push('Masih ada posisi terbuka pada pair yang sama');
    }

    if (
      input.cooldownUntil &&
      Number.isFinite(input.cooldownUntil) &&
      input.cooldownUntil > Date.now()
    ) {
      reasons.push('Pair masih cooldown');
    }

    if (input.signal.orderbookImbalance < 0) {
      warnings.push('Orderbook belum mendukung bias buy');
    }

    if (input.signal.breakoutPressure < 5) {
      warnings.push('Breakout pressure masih lemah');
    }

    if (
      input.settings.strategy.useAntiSpoof &&
      input.signal.orderbookImbalance >= input.settings.strategy.spoofRiskBlockThreshold
    ) {
      reasons.push('Spoof/trap risk threshold terlewati');
    }

    return {
      allowed: reasons.length === 0,
      reasons,
      warnings,
    };
  }

  evaluateExit(
    position: PositionRecord,
    settings: BotSettings,
  ): ExitDecision {
    if (position.status === 'CLOSED') {
      return { shouldExit: false };
    }

    const pnlPct = pctChange(position.averageEntryPrice, position.currentPrice);

    if (
      position.takeProfitPrice !== null &&
      position.currentPrice >= position.takeProfitPrice
    ) {
      return { shouldExit: true, reason: 'TAKE_PROFIT' };
    }

    if (
      position.stopLossPrice !== null &&
      position.currentPrice <= position.stopLossPrice
    ) {
      return { shouldExit: true, reason: 'STOP_LOSS' };
    }

    if (pnlPct >= settings.risk.takeProfitPct) {
      return { shouldExit: true, reason: 'TAKE_PROFIT' };
    }

    if (pnlPct <= -Math.abs(settings.risk.stopLossPct)) {
      return { shouldExit: true, reason: 'STOP_LOSS' };
    }

    const trailingTrigger = settings.risk.takeProfitPct * 0.7;
    if (
      pnlPct >= trailingTrigger &&
      pnlPct <= Math.max(0, trailingTrigger - settings.risk.trailingStopPct)
    ) {
      return { shouldExit: true, reason: 'TRAILING_STOP' };
    }

    return { shouldExit: false };
  }

  buildStops(
    entryPrice: number,
    settings: BotSettings,
  ): {
    stopLossPrice: number | null;
    takeProfitPrice: number | null;
  } {
    if (entryPrice <= 0) {
      return {
        stopLossPrice: null,
        takeProfitPrice: null,
      };
    }

    return {
      stopLossPrice: entryPrice * (1 - settings.risk.stopLossPct / 100),
      takeProfitPrice: entryPrice * (1 + settings.risk.takeProfitPct / 100),
    };
  }
}
