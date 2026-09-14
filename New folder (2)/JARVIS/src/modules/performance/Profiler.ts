export interface ProfileMark {
  label: string;
  durationMs: number;
  at: string;
}

export class Profiler {
  private readonly starts = new Map<string, number>();
  private readonly marks: ProfileMark[] = [];

  start(label: string): void {
    this.starts.set(label, performance.now());
  }

  end(label: string): ProfileMark {
    const started = this.starts.get(label) ?? performance.now();
    const mark = { label, durationMs: performance.now() - started, at: new Date().toISOString() };
    this.marks.push(mark);
    this.starts.delete(label);
    return mark;
  }

  report(): ProfileMark[] {
    return [...this.marks];
  }
}
