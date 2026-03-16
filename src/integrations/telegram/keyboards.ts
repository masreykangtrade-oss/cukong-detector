import { Markup } from 'telegraf';
import type { RuntimePosition, SignalCandidate, TradingMode } from '../../core/types';
import { buildCallback } from './callbackRouter';

export const mainMenuKeyboard = Markup.keyboard(\[
  \['▶️ Start Bot', '⏹️ Stop Bot', '📊 Status'],
  \['👀 Market Watch', '🔥 Hotlist', '📦 Positions'],
  \['🧾 Orders', '🟢 Manual Buy', '🔴 Manual Sell'],
  \['⚙️ Strategy Settings', '🛡️ Risk Settings', '👤 Accounts'],
  \['🪵 Logs', '🚨 Emergency Controls'],
]).resize();

export const emergencyKeyboard = Markup.inlineKeyboard(\[
  \[Markup.button.callback('Pause Auto', buildCallback('EMG', 'MODE', 'ALERT\_ONLY'))],
  \[Markup.button.callback('Pause All', buildCallback('EMG', 'MODE', 'OFF'))],
  \[Markup.button.callback('Cancel All Orders', buildCallback('EMG', 'CANCEL\_ALL'))],
  \[Markup.button.callback('Sell All Positions', buildCallback('EMG', 'SELL\_ALL'))],
]);

export const accountsKeyboard = Markup.inlineKeyboard(\[
  \[Markup.button.callback('List Accounts', buildCallback('ACC', 'LIST'))],
  \[Markup.button.callback('Upload JSON', buildCallback('ACC', 'UPLOAD'))],
  \[Markup.button.callback('Reload', buildCallback('ACC', 'RELOAD'))],
]);

export function tradingModeKeyboard(current: TradingMode) {
  return Markup.inlineKeyboard(\[
    \[Markup.button.callback(`${current === 'OFF' ? '✅ ' : ''}OFF`, buildCallback('SET', 'MODE', 'OFF'))],
    \[Markup.button.callback(`${current === 'ALERT\_ONLY' ? '✅ ' : ''}ALERT\_ONLY`, buildCallback('SET', 'MODE', 'ALERT\_ONLY'))],
    \[Markup.button.callback(`${current === 'SEMI\_AUTO' ? '✅ ' : ''}SEMI\_AUTO`, buildCallback('SET', 'MODE', 'SEMI\_AUTO'))],
    \[Markup.button.callback(`${current === 'FULL\_AUTO' ? '✅ ' : ''}FULL\_AUTO`, buildCallback('SET', 'MODE', 'FULL\_AUTO'))],
  ]);
}

export function hotlistKeyboard(hotlist: SignalCandidate\[]) {
  return Markup.inlineKeyboard(
    hotlist.slice(0, 8).map((item) => \[
      Markup.button.callback(`${item.pair} (${item.score.toFixed(0)})`, buildCallback('SIG', 'DETAIL', undefined, item.pair)),
      Markup.button.callback(`Buy ${item.pair}`, buildCallback('BUY', 'PICK', undefined, item.pair)),
    ]),
  );
}

export function positionsKeyboard(positions: RuntimePosition\[]) {
  return Markup.inlineKeyboard(
    positions.slice(0, 12).flatMap((item) => (\[
      \[Markup.button.callback(`${item.pair} ${item.remainingQuantity}`, buildCallback('POS', 'DETAIL', item.id))],
      \[
        Markup.button.callback('Sell 25%', buildCallback('POS', 'SELL25', item.id)),
        Markup.button.callback('Sell 50%', buildCallback('POS', 'SELL50', item.id)),
      ],
      \[
        Markup.button.callback('Sell 75%', buildCallback('POS', 'SELL75', item.id)),
        Markup.button.callback('Sell 100%', buildCallback('POS', 'SELL100', item.id)),
      ],
    ])),
  );
}
