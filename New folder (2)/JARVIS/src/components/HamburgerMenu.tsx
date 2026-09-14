import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useIntegrationStore } from "../store/integrationStore";
import { useSettingsStore } from "../store/settingsStore";
import type { ProjectKey } from "../types";

interface HamburgerMenuProps {
  onOpenIntegration: () => void;
  onTool: (tool: string) => void;
  onProject: (project: ProjectKey) => void;
}

export function HamburgerMenu({ onOpenIntegration, onTool, onProject }: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const integrations = useIntegrationStore((state) => state.integrations);
  const settings = useSettingsStore();
  const switchLanguage = (language: "en" | "ml") => {
    settings.setLanguage(language);
    void i18n.changeLanguage(language);
  };

  return (
    <>
      <button className="menu-trigger" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu />
      </button>
      <aside className={`hamburger-panel ${open ? "open" : ""}`}>
        <button className="panel-close" onClick={() => setOpen(false)} aria-label="Close menu">
          <X />
        </button>
        <section className="menu-section teal">
          <h2>{t("integrations")}</h2>
          <button className="cta" onClick={onOpenIntegration}>{t("addService")}</button>
          <p>Connected: {integrations.map((item) => item.service).join(" | ")} | + Add</p>
        </section>
        <section className="menu-section purple">
          <h2>{t("tools")}</h2>
          {["File Explorer", "Browser Access", "Code Editor", "Security Audit", "System Settings"].map((tool) => (
            <button key={tool} onClick={() => onTool(tool)}>{tool}</button>
          ))}
        </section>
        <section className="menu-section cyan">
          <h2>{t("projects")}</h2>
          {[
            ["jarvis", "JARVIS"],
            ["zeroops", "ZeroOps"],
            ["venom", "VENOM"],
            ["sector", "SECTOR"],
            ["unigate", "UniGate"]
          ].map(([key, label]) => (
            <button key={key} onClick={() => onProject(key as ProjectKey)}>{label}</button>
          ))}
        </section>
        <section className="menu-section orange">
          <h2>{t("settings")}</h2>
          <div className="segmented">
            <button onClick={() => switchLanguage("en")}>English</button>
            <button onClick={() => switchLanguage("ml")}>Malayalam</button>
          </div>
          <p>Voice: Wake Word {settings.wakeWord ? "ON" : "OFF"} | Speed | Volume</p>
          <p>About CS: ZeroOps co-founder, security-minded full-stack developer.</p>
        </section>
      </aside>
      {open && <button className="scrim" aria-label="Close overlay" onClick={() => setOpen(false)} />}
    </>
  );
}
