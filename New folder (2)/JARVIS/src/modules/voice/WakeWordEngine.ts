export interface WakeWordEvent {
  phrase: string;
  confidence: number;
  at: string;
}

interface SpeechRecognitionAlternativeLike {
  transcript?: string;
}

interface SpeechRecognitionResultLike {
  [index: number]: SpeechRecognitionAlternativeLike | undefined;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike | undefined>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechRecognitionWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

export class WakeWordEngine {
  private active = false;           // true only when recognition should be running
  private restarting = false;       // debounce guard for restart calls
  private falseTriggers = 0;
  private lastDetectedAt = 0;       // epoch ms — prevents double-fire within 2 s
  private listeners = new Set<(event: WakeWordEvent) => void>();
  private recognition: SpeechRecognitionLike | null = null;

  constructor(private readonly sensitivity = 0.6) {
    this._initRecognition();
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  start(): void {
    if (this.active) return;
    this.active = true;
    this._doStart();
  }

  stop(): void {
    this.active = false;
    this.restarting = false;
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // Browser speech recognition may already be stopped.
      }
    }
  }

  // ── Detection subscription ─────────────────────────────────────────────────

  onDetect(listener: (event: WakeWordEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  feedTranscript(transcript: string, audioDurationMs = 900): boolean {
    if (!this.active) return false;
    const normalized = transcript.trim().toLowerCase();
    if (normalized.includes("jarvis pro")) return false;
    const matched =
      normalized === "jarvis" ||
      normalized === "hey jarvis" ||
      /^(hey\s+)?jarvis[\s,.:!?]/.test(normalized);
    if (!matched) return false;
    if (audioDurationMs < 500) {
      this.falseTriggers += 1;
      return false;
    }
    this._fire();
    return true;
  }

  falseTriggerCount(): number {
    return this.falseTriggers;
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  private _initRecognition(): void {
    if (typeof window === "undefined") return;
    const speechWindow = window as SpeechRecognitionWindow;
    const Ctor =
      speechWindow.SpeechRecognition ??
      speechWindow.webkitSpeechRecognition;
    if (!Ctor) return;

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-IN";

    rec.onresult = (event) => {
      if (!this.active) return;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        const transcript = (result[0]?.transcript ?? "").trim().toLowerCase();
        if (transcript.includes("jarvis") && !transcript.includes("jarvis pro")) {
          this._fire();
          break;
        }
      }
    };

    rec.onerror = () => {
      // "no-speech" and "aborted" are normal — just restart
      if (this.active && !this.restarting) {
        this._scheduleRestart(800);
      }
    };

    rec.onend = () => {
      if (this.active && !this.restarting) {
        this._scheduleRestart(200);
      }
    };

    this.recognition = rec;
  }

  private _fire(): void {
    const now = Date.now();
    if (now - this.lastDetectedAt < 2000) return; // debounce 2 s
    this.lastDetectedAt = now;
    const evt: WakeWordEvent = {
      phrase: "Jarvis",
      confidence: this.sensitivity,
      at: new Date(now).toISOString(),
    };
    // Notify all listeners
    this.listeners.forEach((l) => l(evt));
    // Stop recognition so we don't keep detecting while listening
    this.active = false;
    try {
      this.recognition?.abort();
    } catch {
      // Browser speech recognition may already be stopped.
    }
  }

  private _doStart(): void {
    if (!this.recognition || !this.active) return;
    try {
      this.recognition.start();
    } catch {
      // Recognition may already be running — schedule a clean restart
      this._scheduleRestart(300);
    }
  }

  private _scheduleRestart(delayMs: number): void {
    if (this.restarting) return;
    this.restarting = true;
    setTimeout(() => {
      this.restarting = false;
      if (this.active) this._doStart();
    }, delayMs);
  }
}
