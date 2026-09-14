import { Mic2 } from "lucide-react";
import { useVoice } from "../hooks/useVoice";

export function VoiceInput({ onTranscript }: { onTranscript: (text: string) => void }) {
  const voice = useVoice();
  const listen = async () => {
    const result = await voice.listen();
    if (result.text) onTranscript(result.text);
  };
  return (
    <button className={`voice-input ${voice.listening ? "active" : ""}`} onClick={() => void listen()}>
      <Mic2 size={16} /> {voice.listening ? "Listening..." : "Voice"}
    </button>
  );
}
