import { createChildLogger } from './logger';

const log = createChildLogger({ module: 'request-pacer' });

export interface PacerLaneConfig {
  name: string;
  priority: number;
  minIntervalMs: number;
  coalesce?: boolean;
}

interface QueueItem<T> {
  lane: string;
  key?: string;
  run: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  enqueuedAt: number;
  sharedPromise?: Promise<T>;
}

interface LaneState {
  config: PacerLaneConfig;
  queue: QueueItem<unknown>[];
  inflightByKey: Map<string, Promise<unknown>>;
  nextAllowedAtMs: number;
  coalescedCount: number;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export class RequestPacer {
  private readonly lanes = new Map<string, LaneState>();
  private dispatchTimer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly pacerName: string,
    laneConfigs: PacerLaneConfig[],
  ) {
    for (const config of laneConfigs) {
      this.lanes.set(config.name, {
        config,
        queue: [],
        inflightByKey: new Map(),
        nextAllowedAtMs: 0,
        coalescedCount: 0,
      });
    }
  }

  snapshot(): Array<{
    lane: string;
    priority: number;
    queueDepth: number;
    inflight: number;
    nextAllowedAtMs: number;
    coalescedCount: number;
  }> {
    return Array.from(this.lanes.values()).map((state) => ({
      lane: state.config.name,
      priority: state.config.priority,
      queueDepth: state.queue.length,
      inflight: state.inflightByKey.size,
      nextAllowedAtMs: state.nextAllowedAtMs,
      coalescedCount: state.coalescedCount,
    }));
  }

  async schedule<T>(
    lane: string,
    run: () => Promise<T>,
    options: { key?: string } = {},
  ): Promise<T> {
    const laneState = this.lanes.get(lane);
    if (!laneState) {
      throw new Error(`Unknown pacing lane: ${lane}`);
    }

    const key = options.key;
    if (laneState.config.coalesce && key) {
      const inflight = laneState.inflightByKey.get(key) as Promise<T> | undefined;
      if (inflight) {
        laneState.coalescedCount += 1;
        log.info(
          {
            pacer: this.pacerName,
            lane,
            priority: laneState.config.priority,
            queueDepth: laneState.queue.length,
            coalesced: true,
            key,
          },
          'request coalesced with inflight key',
        );
        return inflight;
      }

      const queued = laneState.queue.find((item) => item.key === key);
      if (queued?.sharedPromise) {
        laneState.coalescedCount += 1;
        log.info(
          {
            pacer: this.pacerName,
            lane,
            priority: laneState.config.priority,
            queueDepth: laneState.queue.length,
            coalesced: true,
            key,
          },
          'request coalesced with queued key',
        );
        return queued.sharedPromise as Promise<T>;
      }
    }

    const promise = new Promise<T>((resolve, reject) => {
      const item: QueueItem<T> = {
        lane,
        key,
        run,
        resolve,
        reject,
        enqueuedAt: Date.now(),
      };

      item.sharedPromise = new Promise<T>((sharedResolve, sharedReject) => {
        const originalResolve = item.resolve;
        const originalReject = item.reject;

        item.resolve = (value: T) => {
          originalResolve(value);
          sharedResolve(value);
        };

        item.reject = (error: Error) => {
          originalReject(error);
          sharedReject(error);
        };
      });

      laneState.queue.push(item as QueueItem<unknown>);
      this.armDispatch();
    });

    return promise;
  }

  private armDispatch(delayMs = 0): void {
    if (this.running) {
      return;
    }

    if (this.dispatchTimer) {
      return;
    }

    this.dispatchTimer = setTimeout(() => {
      this.dispatchTimer = null;
      void this.dispatch();
    }, Math.max(0, delayMs));
  }

  private pickReadyLane(nowMs: number): LaneState | null {
    const candidates = Array.from(this.lanes.values())
      .filter((lane) => lane.queue.length > 0)
      .sort((a, b) => b.config.priority - a.config.priority);

    for (const lane of candidates) {
      if (lane.nextAllowedAtMs <= nowMs) {
        return lane;
      }
    }

    return null;
  }

  private nextWakeDelay(nowMs: number): number {
    const waiting = Array.from(this.lanes.values())
      .filter((lane) => lane.queue.length > 0)
      .map((lane) => Math.max(0, lane.nextAllowedAtMs - nowMs));

    if (waiting.length === 0) {
      return 0;
    }

    return Math.min(...waiting);
  }

  private async dispatch(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      while (true) {
        const nowMs = Date.now();
        const lane = this.pickReadyLane(nowMs);

        if (!lane) {
          const delay = this.nextWakeDelay(nowMs);
          if (delay > 0) {
            this.armDispatch(delay);
          }
          break;
        }

        const item = lane.queue.shift();
        if (!item) {
          continue;
        }

        const holdMs = Math.max(0, lane.nextAllowedAtMs - item.enqueuedAt);
        if (holdMs > 0) {
          log.info(
            {
              pacer: this.pacerName,
              lane: lane.config.name,
              priority: lane.config.priority,
              queueDepth: lane.queue.length,
              holdMs,
            },
            'request held by pacing',
          );
        }

        lane.nextAllowedAtMs = Date.now() + Math.max(0, lane.config.minIntervalMs);

        const inflightKey = item.key;
        if (lane.config.coalesce && inflightKey) {
          const sharedPromise = Promise.resolve()
            .then(() => item.run())
            .finally(() => {
              lane.inflightByKey.delete(inflightKey);
            });
          lane.inflightByKey.set(inflightKey, sharedPromise);

          try {
            const result = await sharedPromise;
            item.resolve(result);
          } catch (error) {
            item.reject(toError(error));
          }
        } else {
          try {
            const result = await item.run();
            item.resolve(result);
          } catch (error) {
            item.reject(toError(error));
          }
        }
      }
    } finally {
      this.running = false;
    }
  }
}
