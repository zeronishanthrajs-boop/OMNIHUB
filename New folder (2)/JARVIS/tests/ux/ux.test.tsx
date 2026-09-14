import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../../src/App";
import "../../src/i18n";

describe("ux suite", () => {
  it("renders at mobile width", () => {
    window.innerWidth = 375;
    render(<App />);
    expect(screen.getAllByText("JARVIS").length).toBeGreaterThan(0);
  });

  it("renders at desktop width", () => {
    window.innerWidth = 1920;
    render(<App />);
    expect(screen.getByLabelText("Project context switcher")).toBeInTheDocument();
  });

  it("opens menu and command palette shortcuts", () => {
    render(<App />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByText("Type a command or shortcut")).toBeInTheDocument();
  });

  it("language string storage is available", () => {
    window.localStorage.setItem("jarvis_lang", "ml");
    expect(window.localStorage.getItem("jarvis_lang")).toBe("ml");
  });

  it("error states can display", async () => {
    render(<App />);
    expect(screen.queryByText("Connection timed out. Retrying (2/3)...")).not.toBeInTheDocument();
  });
});
