export interface AuditRecord {
  at: string;
  actor: string;
  action: string;
  target: string;
  result: "allowed" | "blocked" | "failed";
  metadata?: Record<string, string | number | boolean>;
}

export class AuditLogger {
  private readonly records: AuditRecord[] = [];

  log(record: Omit<AuditRecord, "at">): AuditRecord {
    const entry: AuditRecord = { at: new Date().toISOString(), ...record };
    this.records.push(entry);
    return entry;
  }

  list(): AuditRecord[] {
    return [...this.records];
  }

  exportJson(): string {
    return JSON.stringify(this.records, null, 2);
  }
}

export const auditLogger = new AuditLogger();
