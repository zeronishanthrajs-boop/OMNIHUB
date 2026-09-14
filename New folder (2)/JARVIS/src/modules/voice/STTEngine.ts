import type { VoiceResult } from "../../types";

interface RecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface RecognitionResultListLike {
  length: number;
  [index: number]: { [alternativeIndex: number]: RecognitionAlternative | undefined } | undefined;
}

interface RecognitionEventLike {
  results: RecognitionResultListLike;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export class STTEngine {
  async listenOnce(timeoutMs = 8000): Promise<VoiceResult> {
    const start = performance.now();
    const SpeechRecognitionCtor = this.resolveSpeechRecognition();
    if (!SpeechRecognitionCtor) {
      return { text: "", confidence: 0, durationMs: Math.round(performance.now() - start) };
    }
    return new Promise((resolve) => {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      let finalTranscript = "";
      let confidence = 0.8;

      const timer = window.setTimeout(() => {
        recognition.stop();
      }, timeoutMs);

      recognition.onresult = (event: RecognitionEventLike) => {
        let transcript = "";
        let conf = 0.8;
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i]?.[0];
          if (result) {
            transcript += (transcript ? " " : "") + result.transcript.trim();
            conf = result.confidence;
          }
        }
        finalTranscript = transcript;
        confidence = conf;
      };

      recognition.onerror = () => {
        window.clearTimeout(timer);
        resolve({ text: "", confidence: 0, durationMs: Math.round(performance.now() - start) });
      };

      recognition.onend = () => {
        window.clearTimeout(timer);
        resolve({
          text: finalTranscript.trim(),
          confidence: confidence,
          durationMs: Math.round(performance.now() - start)
        });
      };

      recognition.start();
    });
  }

  private resolveSpeechRecognition(): SpeechRecognitionConstructor | null {
    const record = window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    return record.SpeechRecognition ?? record.webkitSpeechRecognition ?? null;
  }
}
