import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserAccess } from "./components/BrowserAccess";
import { CommandInput } from "./components/CommandInput";
import { CommandPalette } from "./components/CommandPalette";
import { ErrorState } from "./components/ErrorState";
import { FileExplorer } from "./components/FileExplorer";
import { HamburgerMenu } from "./components/HamburgerMenu";
import { IntegrationModal } from "./components/IntegrationModal";
import { Logo3D } from "./components/Logo3D";
import { ProcessingIndicator } from "./components/ProcessingIndicator";
import { ProjectSwitcher } from "./components/ProjectSwitcher";
import { ResponseDisplay } from "./components/ResponseDisplay";
import { VoiceInput } from "./components/VoiceInput";
import { WakeWordListener } from "./components/WakeWordListener";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useVoice } from "./hooks/useVoice";
import { claudeClient } from "./modules/ai/ClaudeClient";
import { DebugAssistant } from "./modules/ai/DebugAssistant";
import { Profiler } from "./modules/performance/Profiler";
import { tierRouter } from "./modules/performance/TierRouter";
import { SecurityAudit } from "./modules/security/SecurityAudit";
import { useProjectStore } from "./store/projectStore";
import { useSettingsStore } from "./store/settingsStore";
import type { ChatMessage, ErrorKind, LogoState, ProjectKey, SecurityFinding, Tier } from "./types";

const createMessage = (role: ChatMessage["role"], content: string, tier?: Tier): ChatMessage => ({
  id: crypto.randomUUID(),
  role,
  content,
  tier,
  createdAt: new Date().toISOString()
});

export function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [logoState, setLogoState] = useState<LogoState>("idle");
  const [tier, setTier] = useState<Tier>(2);
  const [busy, setBusy] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [integrationOpen, setIntegrationOpen] = useState(false);
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [wakeListening, setWakeListening] = useState(false);
  const [interrupted, setInterrupted] = useState(false);

  const activeAbortRef = useRef<AbortController | null>(null);
  const activeStreamIdRef = useRef<string | null>(null);
  const stopRequestedRef = useRef(false);
  const errorKindRef = useRef<ErrorKind | null>(null);

  const projects = useProjectStore((state) => state.projects);
  const activeProject = useProjectStore((state) => state.activeProject);
  const activeKey = useProjectStore((state) => state.activeKey);
  const switchProject = useProjectStore((state) => state.switchProject);
  const settings = useSettingsStore();
  const profiler = useMemo(() => new Profiler(), []);
  const voice = useVoice();

  useEffect(() => {
    errorKindRef.current = errorKind;
  }, [errorKind]);

  useEffect(() => {
    voice.onSpeechEnd(() => {
      setIsSpeaking(false);
    });
  }, [voice]);

  const stopActiveResponse = useCallback(() => {
    stopRequestedRef.current = true;
    activeAbortRef.current?.abort();
    const streamId = activeStreamIdRef.current;
    if (streamId) void claudeClient.stopStream(streamId);
    voice.stop();
    setIsSpeaking(false);
    setInterrupted(true);
    setBusy(false);
    setLogoState("idle");
  }, [voice]);
  const switchTo = useCallback(
    (project: ProjectKey) => {
      switchProject(project);
      setMessages((current) => [...current, createMessage("system", `Context switched to ${project.toUpperCase()}.`)]);
    },
    [switchProject]
  );

  const submit = useCallback(
    async (query: string, speakResponse = false) => {
      const q = query.trim().toLowerCase();

      // Intercept context switching commands (e.g. "switch context to ZeroOps", "switch to jarvis")
      const switchMatch = q.match(/^(?:switch|change)(?:\s+project|\s+context)?\s+to\s+(.+)$/);
      if (switchMatch) {
        const targetProj = switchMatch[1].trim().toLowerCase();
        let targetKey: ProjectKey | null = null;
        if (targetProj === "jarvis") targetKey = "jarvis";
        else if (targetProj === "zeroops" || targetProj === "zero ops") targetKey = "zeroops";
        else if (targetProj === "venom") targetKey = "venom";
        else if (targetProj === "sector") targetKey = "sector";
        else if (targetProj === "unigate" || targetProj === "uni gate") targetKey = "unigate";

        if (targetKey) {
          switchTo(targetKey);
          setInterrupted(false);
          setErrorKind(null);
          setBusy(true);
          setLogoState("processing");
          setMessages((current) => [...current, createMessage("user", query, 1)]);
          try {
            setMessages((current) => [...current, createMessage("assistant", `Context switched to ${targetKey.toUpperCase()}.`, 1)]);
            setLogoState("done");
            if (speakResponse) voice.speak(`Context switched to ${targetKey}`);
          } finally {
            setBusy(false);
            window.setTimeout(() => setLogoState("idle"), 1200);
          }
          return;
        }
      }


      // Intercept open commands (e.g. "open youtube", "open notepad")
      if (q.startsWith("open ") || q === "open youtube") {
        const target = q.startsWith("open ") ? query.slice(5).trim() : "youtube";
        setInterrupted(false);
        setErrorKind(null);
        setBusy(true);
        setLogoState("processing");
        setMessages((current) => [...current, createMessage("user", query, 1)]);
        setStreamingText("Analyzing system request...");
        voice.stop();
        if (speakResponse) setIsSpeaking(true);

        try {
          const res = await fetch("/api/system/open", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target })
          });
          const data = await res.json() as { ok?: boolean; error?: string };
          if (data.ok) {
            setMessages((current) => [...current, createMessage("assistant", `I have successfully opened ${target} across your system.`, 1)]);
            setLogoState("done");
            if (speakResponse) voice.speak(`Opened ${target}`);
          } else {
            setMessages((current) => [...current, createMessage("system", `System error: ${data.error}`, 1)]);
            setLogoState("error");
          }
        } catch {
          setMessages((current) => [...current, createMessage("system", "Connection failed: unable to access system actions.", 1)]);
          setLogoState("error");
        } finally {
          setStreamingText("");
          setBusy(false);
          if (speakResponse) setIsSpeaking(false);
          window.setTimeout(() => setLogoState("idle"), 1200);
        }
        return;
      }

      // Intercept lock commands
      if (q === "lock screen" || q === "lock my pc" || q === "lock pc") {
        setInterrupted(false);
        setErrorKind(null);
        setBusy(true);
        setLogoState("processing");
        setMessages((current) => [...current, createMessage("user", query, 1)]);
        setStreamingText("Securing workstation...");
        voice.stop();
        if (speakResponse) setIsSpeaking(true);

        try {
          await fetch("/api/system/control", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "lock" })
          });
          setMessages((current) => [...current, createMessage("assistant", "Locking screen...", 1)]);
          setLogoState("done");
          if (speakResponse) voice.speak("PC locked.");
        } catch {
          setLogoState("error");
        } finally {
          setStreamingText("");
          setBusy(false);
          if (speakResponse) setIsSpeaking(false);
          window.setTimeout(() => setLogoState("idle"), 1200);
        }
        return;
      }

      // Intercept volume commands (e.g. "set volume to 80", "volume 50")
      const volMatch = q.match(/^(?:set\s+)?volume\s+(?:to\s+)?(\d+)(?:%)?$/);
      if (volMatch) {
        const level = Number(volMatch[1]);
        setInterrupted(false);
        setErrorKind(null);
        setBusy(true);
        setLogoState("processing");
        setMessages((current) => [...current, createMessage("user", query, 1)]);
        setStreamingText(`Adjusting volume to ${level}%...`);
        voice.stop();
        if (speakResponse) setIsSpeaking(true);

        try {
          const res = await fetch("/api/system/control", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "volume", level })
          });
          const data = await res.json() as { ok?: boolean; error?: string };
          if (data.ok) {
            setMessages((current) => [...current, createMessage("assistant", `Speaker volume set to ${level}%.`, 1)]);
            setLogoState("done");
            if (speakResponse) voice.speak(`Volume set to ${level} percent.`);
          } else {
            setLogoState("error");
          }
        } catch {
          setLogoState("error");
        } finally {
          setStreamingText("");
          setBusy(false);
          if (speakResponse) setIsSpeaking(false);
          window.setTimeout(() => setLogoState("idle"), 1200);
        }
        return;
      }

      activeAbortRef.current?.abort();
      const previousStreamId = activeStreamIdRef.current;
      if (previousStreamId) void claudeClient.stopStream(previousStreamId);

      const selectedTier = tierRouter.classifyTier(query);
      const controller = new AbortController();
      const streamId = crypto.randomUUID();
      activeAbortRef.current = controller;
      activeStreamIdRef.current = streamId;
      stopRequestedRef.current = false;

      setInterrupted(false);
      setErrorKind(null);
      setTier(selectedTier);
      setBusy(true);
      setLogoState("processing");
      setMessages((current) => [...current, createMessage("user", query, selectedTier)]);
      setStreamingText("");
      voice.stop();
      if (speakResponse) setIsSpeaking(true);
      profiler.start("query");

      let answer = "";
      let sentenceBuffer = "";
      let wasStopped = false;

      try {
        for await (const event of claudeClient.streamQuery(query, selectedTier, activeProject, { signal: controller.signal, streamId })) {
          if (event.type === "aborted") {
            wasStopped = true;
            break;
          }

          if (event.type === "token") {
            answer += event.value;
            setStreamingText(answer);

            if (speakResponse) {
              sentenceBuffer += event.value;
              const boundaryRegex = /[^.!?\n]+[.!?\n]+/g;
              let lastIndex = 0;
              let matchArray: RegExpExecArray | null;
              const sentences: string[] = [];
              while ((matchArray = boundaryRegex.exec(sentenceBuffer)) !== null) {
                sentences.push(matchArray[0]);
                lastIndex = boundaryRegex.lastIndex;
              }
              if (sentences.length > 0) {
                sentenceBuffer = sentenceBuffer.slice(lastIndex);
                for (const sentence of sentences) {
                  const trimmed = sentence.trim();
                  if (trimmed) voice.speak(trimmed);
                }
              }
              if (sentenceBuffer.length > 120) {
                const lastSpace = sentenceBuffer.lastIndexOf(" ");
                if (lastSpace > 40) {
                  const chunk = sentenceBuffer.slice(0, lastSpace).trim();
                  sentenceBuffer = sentenceBuffer.slice(lastSpace);
                  if (chunk) voice.speak(chunk);
                }
              }
            }
          }

          if (event.type === "error") {
            setErrorKind(event.value.includes("timed out") ? "api-timeout" : "service-down");
          }
        }
      } catch {
        wasStopped = controller.signal.aborted || stopRequestedRef.current;
        if (!wasStopped) setErrorKind("service-down");
      }

      wasStopped = wasStopped || controller.signal.aborted || stopRequestedRef.current;
      if (speakResponse && sentenceBuffer.trim() && !wasStopped) voice.speak(sentenceBuffer.trim());
      if (speakResponse && (!answer.trim() || wasStopped)) setIsSpeaking(false);

      if (wasStopped) {
        const stoppedAnswer = answer.trim() ? `${answer.trim()}\n\n[Stopped]` : "Response stopped.";
        setMessages((current) => [...current, createMessage(answer.trim() ? "assistant" : "system", stoppedAnswer, selectedTier)]);
      } else {
        const finalAnswer = answer || "Service down. Using cached data when available.";
        tierRouter.markCached(query);
        setMessages((current) => [...current, createMessage("assistant", finalAnswer, selectedTier)]);
      }

      setStreamingText("");
      setBusy(false);
      setLogoState(wasStopped ? "idle" : errorKindRef.current ? "error" : "done");
      profiler.end("query");
      if (activeAbortRef.current === controller) activeAbortRef.current = null;
      if (activeStreamIdRef.current === streamId) activeStreamIdRef.current = null;
      if (!wasStopped) window.setTimeout(() => setLogoState("idle"), 900);
    },
    [activeProject, profiler, voice, switchTo]
  );

  const startVoiceTurn = useCallback(async () => {
    if (busy) {
      stopActiveResponse();
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    setLogoState("listening");
    setWakeListening(true);
    try {
      const result = await voice.listen();
      if (result.text && result.text.trim()) {
        await submit(result.text.trim(), true);
      } else {
        setLogoState("idle");
      }
    } catch {
      setLogoState("idle");
      setErrorKind("voice-failed");
    } finally {
      setWakeListening(false);
    }
  }, [busy, stopActiveResponse, submit, voice]);

  const playChime = useCallback(() => {
    try {
      const AudioContextClass =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.12);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.0, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.25);
      gain2.gain.setValueAtTime(0.08, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.28);
    } catch (e) {
      console.error("Failed to play chime", e);
    }
  }, []);

  const handleWake = useCallback(async () => {
    playChime();
    await new Promise((resolve) => setTimeout(resolve, 300));
    await startVoiceTurn();
  }, [playChime, startVoiceTurn]);

  const isWakeWordEngineEnabled =
    settings.wakeWord &&
    !busy &&
    !wakeListening &&
    !isSpeaking &&
    logoState === "idle";

  const runSecurityAudit = useCallback(() => {
    const audit = new SecurityAudit();
    const results = audit.scanFiles([{ path: "src/App.tsx", content: document.documentElement.outerHTML }]);
    setFindings(results);
    setActiveTool("Security Audit");
  }, []);

  const runDebugAssistant = useCallback(() => {
    const debug = new DebugAssistant().analyze("MongoDB timeout while connecting to integration API");
    setMessages((current) => [
      ...current,
      createMessage("assistant", `Root cause (${debug.confidence}%): ${debug.rootCause}\n\n${debug.fixes.map((fix) => `- ${fix}`).join("\n")}`)
    ]);
  }, []);



  useKeyboardShortcuts({
    openPalette: () => setPaletteOpen(true),
    submit: () => void submit("Status check for active project.", false),
    close: () => {
      setPaletteOpen(false);
      setIntegrationOpen(false);
      setActiveTool(null);
    },
    securityAudit: runSecurityAudit,
    debugAssistant: runDebugAssistant,
    profiler: () => setMessages((current) => [...current, createMessage("assistant", JSON.stringify(profiler.report(), null, 2))]),
    switchProject: switchTo
  });

  const toolPanel = () => {
    if (activeTool === "File Explorer" || activeTool === "Code Editor") return <FileExplorer />;
    if (activeTool === "Browser Access") return <BrowserAccess />;
    if (activeTool === "Security Audit") {
      return (
        <section className="audit-panel">
          <h2>SECURITY AUDIT - {activeProject.name}</h2>
          {findings.map((finding) => (
            <article key={finding.id} className={finding.severity}>
              <b>{finding.severity.toUpperCase()}</b> {finding.title}
              <p>{finding.recommendation}</p>
            </article>
          ))}
        </section>
      );
    }
    if (activeTool === "System Settings") {
      return (
        <section className="audit-panel">
          <h2>System Settings</h2>
          <p>Language: {settings.language} | Response Speed: {settings.speed} | Wake Word: {settings.wakeWord ? "ON" : "OFF"}</p>
        </section>
      );
    }
    return null;
  };

  return (
    <div className="app-shell">
      <HamburgerMenu onOpenIntegration={() => setIntegrationOpen(true)} onTool={setActiveTool} onProject={switchTo} />
      <ProjectSwitcher projects={projects} active={activeKey} onSwitch={switchTo} />
      <main className="clean-canvas">
        <section className="assistant-hero" aria-label="JARVIS command center">
          <Logo3D state={logoState} />
          <div className="assistant-title">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <span>{activeProject.name}</span>
              <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "rgba(6, 182, 212, 0.15)", color: "#22d3ee", border: "1px solid rgba(6, 182, 212, 0.3)" }}>
                Qwen2.5-Coder 7B
              </span>
            </div>
            <h1>JARVIS</h1>
            <p>{busy ? "Streaming local response" : interrupted ? "Interrupted and ready" : "Local assistant online"}</p>
          </div>
        </section>
        <WakeWordListener enabled={isWakeWordEngineEnabled} onWake={handleWake} />
        <CommandInput
          onSubmit={(value) => void submit(value, false)}
          onVoice={() => void startVoiceTurn()}
          onStop={stopActiveResponse}
          busy={busy}
        />
        <VoiceInput
          onTranscript={(text) => {
            if (busy) stopActiveResponse();
            void submit(text, true);
          }}
        />
        <ProcessingIndicator tier={tier} active={busy} />
        {errorKind && <ErrorState kind={errorKind} />}
      </main>
      <ResponseDisplay messages={messages} streamingText={streamingText} />
      {toolPanel()}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onAction={setActiveTool} onProject={switchTo} />
      <IntegrationModal open={integrationOpen} onClose={() => setIntegrationOpen(false)} />
    </div>
  );
}
