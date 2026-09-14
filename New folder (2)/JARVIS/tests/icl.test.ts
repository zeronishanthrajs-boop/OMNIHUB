// @vitest-environment node
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createServer } from "../server/index";

const app = createServer();

async function queryModel(payload: string | Array<{ role: string; content: string }>): Promise<string> {
  const prevOllamaHost = process.env.OLLAMA_HOST;
  const prevNodeEnv = process.env.NODE_ENV;
  const prevJarvisModel = process.env.JARVIS_MODEL;

  process.env.OLLAMA_HOST = "http://127.0.0.1:11434";
  process.env.NODE_ENV = "development";
  process.env.JARVIS_MODEL = process.env.TEST_MODEL || "qwen2.5-coder:7b";

  try {
    const body: {
      tier: number;
      projectKey: string;
      userContext: string;
      systemPrompt: string;
      query?: string;
      messages?: Array<{ role: string; content: string }>;
    } = {
      tier: 2,
      projectKey: "jarvis",
      userContext: "test",
      systemPrompt: "test"
    };
    if (typeof payload === "string") {
      body.query = payload;
    } else {
      body.messages = payload;
    }

    const response = await request(app)
      .post("/api/claude/stream")
      .send(body);
    return response.text;
  } finally {
    process.env.NODE_ENV = prevNodeEnv;
    if (prevOllamaHost) {
      process.env.OLLAMA_HOST = prevOllamaHost;
    } else {
      delete process.env.OLLAMA_HOST;
    }
    if (prevJarvisModel) {
      process.env.JARVIS_MODEL = prevJarvisModel;
    } else {
      delete process.env.JARVIS_MODEL;
    }
  }
}

describe('In-Context Learning', () => {
  it('adapts to emoji style in same context', async () => {
    const prompt = `Respond in only emojis:
      Q: How are you?
      A: 😊✨
      
      Now: What is JARVIS?`;
    
    const response = await queryModel(prompt);
    expect(response).toMatch(/[😊🤖⚡🚀]|:[a-z0-9_-]+:/u);  // Contains emojis
  }, 180000);

  it('follows JSON format from examples', async () => {
    const prompt = `{"question": "2+2?", "answer": 4}
      {"question": "3+3?", "answer": 6}
      {"question": "5+5?", "answer":`;
    
    const response = await queryModel(prompt);
    const trimmed = response.trim();
    expect(trimmed.includes('10')).toBe(true);  // Completes JSON pattern with 10 or 10}
  }, 180000);

  it('uses in-context knowledge without RAG', async () => {
    const prompt = `ZeroOps: Founded by Nishanth, Business Automation.
      Q: Who founded ZeroOps?`;
    
    const response = await queryModel(prompt);
    expect(response.toLowerCase()).toContain('nishanth');
  }, 180000);
});

describe('ICL Entity Tracking Fix', () => {
  it('tracks Tesla entity correctly', async () => {
    const messages = [
      { role: 'user', content: 'Who is Nikola Tesla?' },
      { role: 'assistant', content: 'Nikola Tesla was...' },
      { role: 'user', content: 'Was he married?' }
    ];
    
    const response = await queryModel(messages);
    
    // Should answer about Tesla, NOT Nishanth
    expect(response.toLowerCase()).toContain('tesla');
    expect(response.toLowerCase()).toMatch(/marri|status/);
    expect(response).not.toMatch(/nishanth/i);
  }, 180000);

  it('distinguishes between Nishanth and discussed entities', async () => {
    const messages = [
      { role: 'user', content: 'Tell me about Steve Jobs' },
      { role: 'user', content: 'Was he the founder?' }
    ];
    
    const response = await queryModel(messages);
    
    // Should answer about Steve Jobs
    expect(response).toMatch(/apple.*founder|founder/i);
    // Should NOT confuse with Nishanth
    expect(response).not.toMatch(/nishanth.*founder/i);
  }, 180000);

  it('maintains Nishanth identity when explicitly asked', async () => {
    const messages = [
      { role: 'user', content: 'Who created you?' },
      { role: 'user', content: 'Is he the CEO of ZeroOps?' }
    ];
    
    const response = await queryModel(messages);
    
    // Should correctly identify Nishanth as creator
    expect(response.toLowerCase()).toMatch(/nishanth/);
    expect(response.toLowerCase()).toMatch(/zero?ops/);
  }, 180000);
});
