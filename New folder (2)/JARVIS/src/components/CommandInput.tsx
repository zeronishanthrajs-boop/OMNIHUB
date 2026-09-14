import { Mic, Send, Square } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface CommandInputProps {
  onSubmit: (value: string) => void;
  onVoice: () => void;
  onStop?: () => void;
  busy?: boolean;
}

export function CommandInput({ onSubmit, onVoice, onStop, busy = false }: CommandInputProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const submit = () => {
    if (busy) return;
    const clean = value.trim();
    if (!clean) return;
    onSubmit(clean);
    setValue("");
  };
  return (
    <div className="command-shell">
      {!value && <span className="input-hint">{t("ask")}</span>}
      <input
        aria-label="Ask JARVIS"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) submit();
        }}
      />
      <button type="button" className="icon-button" onClick={onVoice} aria-label="Activate voice input">
        <Mic size={18} />
      </button>
      <button
        type="button"
        className={`icon-button primary ${busy ? "stop" : ""}`}
        onClick={busy ? onStop : submit}
        aria-label={busy ? "Stop response" : "Submit command"}
      >
        {busy ? <><Square size={15} /> <span>Stop</span></> : <Send size={18} />}
      </button>
    </div>
  );
}
