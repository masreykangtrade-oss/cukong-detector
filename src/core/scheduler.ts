export interface ScheduledJob {
  name: string;
  intervalMs: number;
  run: () => Promise<void>;
}

interface InternalJob extends ScheduledJob {
  timer: NodeJS.Timeout | null;
  running: boolean;
}

export class LightScheduler {
  private readonly jobs = new Map<string, InternalJob>();

  add(job: ScheduledJob): void {
    this.jobs.set(job.name, { ...job, timer: null, running: false });
  }

  start(name?: string): void {
    const selected = name ? \[this.jobs.get(name)].filter(Boolean) as InternalJob\[] : Array.from(this.jobs.values());
    for (const job of selected) {
      if (job.timer) {
        continue;
      }
      job.timer = setInterval(async () => {
        if (job.running) {
          return;
        }
        job.running = true;
        try {
          await job.run();
        } finally {
          job.running = false;
        }
      }, job.intervalMs);
    }
  }

  stop(name?: string): void {
    const selected = name ? \[this.jobs.get(name)].filter(Boolean) as InternalJob\[] : Array.from(this.jobs.values());
    for (const job of selected) {
      if (job.timer) {
        clearInterval(job.timer);
        job.timer = null;
      }
      job.running = false;
    }
  }

  stopAll(): void {
    this.stop();
  }

  list(): { name: string; intervalMs: number; running: boolean }\[] {
    return Array.from(this.jobs.values()).map((job) => ({
      name: job.name,
      intervalMs: job.intervalMs,
      running: job.running,
    }));
  }
}
