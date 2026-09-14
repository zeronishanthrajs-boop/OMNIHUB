import { Eye, X } from "lucide-react";
import { useState } from "react";
import { useIntegrationStore } from "../store/integrationStore";

interface IntegrationModalProps {
  open: boolean;
  onClose: () => void;
}

const serviceOptions = ["VENOM", "GitHub", "Asana", "Slack", "Linear", "Figma", "Google Drive", "Notion", "Custom API"];

export function IntegrationModal({ open, onClose }: IntegrationModalProps) {
  const upsert = useIntegrationStore((state) => state.upsert);
  const [service, setService] = useState("VENOM");
  const [token, setToken] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [showToken, setShowToken] = useState(false);
  if (!open) return null;

  const connect = () => {
    upsert({
      id: service.toLowerCase().replace(/\s+/g, "-"),
      service,
      tokenRef: `${service.toUpperCase().replace(/\s+/g, "_")}_TOKEN`,
      webhookUrl,
      customPrompt,
      enabled: true,
      health: token ? "healthy" : "degraded",
      lastChecked: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="modal-layer">
      <div className="integration-modal">
        <button className="panel-close" onClick={onClose} aria-label="Close integration modal"><X /></button>
        <h2>Connect to External Service</h2>
        <label>Service<select value={service} onChange={(event) => setService(event.target.value)}>{serviceOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label>API Key / Auth Token<div className="secret-field"><input type={showToken ? "text" : "password"} value={token} onChange={(event) => setToken(event.target.value)} /><button onClick={() => setShowToken((value) => !value)}><Eye size={16} /></button></div></label>
        <label>Webhook URL<input value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} /></label>
        <label>Custom Prompt<textarea value={customPrompt} onChange={(event) => setCustomPrompt(event.target.value)} /></label>
        <div className="modal-actions"><button onClick={onClose}>Cancel</button><button className="cta" onClick={connect}>Connect</button></div>
      </div>
    </div>
  );
}
