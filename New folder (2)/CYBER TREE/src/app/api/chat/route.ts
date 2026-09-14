import { NextRequest, NextResponse } from 'next/server';
import { queryNodes } from '@/lib/db';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// Severity classification heuristic based on keywords in user message
function classifySeverity(message: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  const lower = message.toLowerCase();
  if (
    lower.includes('ransomware') || lower.includes('zero-day') || lower.includes('0-day') ||
    lower.includes('data breach') || lower.includes('exfiltration') || lower.includes('critical') ||
    lower.includes('nation state') || lower.includes('apt') || lower.includes('system down') ||
    lower.includes('active exploit') || lower.includes('backdoor') || lower.includes('rootkit')
  ) return 'CRITICAL';
  if (
    lower.includes('malware') || lower.includes('phishing') || lower.includes('intrusion') ||
    lower.includes('unauthorized access') || lower.includes('lateral movement') ||
    lower.includes('privilege escalation') || lower.includes('high') || lower.includes('vulnerability')
  ) return 'HIGH';
  if (
    lower.includes('suspicious') || lower.includes('anomaly') || lower.includes('alert') ||
    lower.includes('scan') || lower.includes('probe') || lower.includes('medium') ||
    lower.includes('unusual') || lower.includes('warning')
  ) return 'MEDIUM';
  return 'LOW';
}

// Prompt injection guard — block override attempts
const BLOCKED_PHRASES = [
  'ignore previous instructions', 'disregard your instructions', 'you are now',
  'act as', 'forget all instructions', 'override', 'system prompt', 'jailbreak'
];
function sanitizeMessage(msg: string): string {
  const lower = msg.toLowerCase();
  for (const phrase of BLOCKED_PHRASES) {
    if (lower.includes(phrase)) {
      return '[Message blocked: contains disallowed instruction override pattern]';
    }
  }
  return msg.slice(0, 2000); // hard cap at 2000 chars
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body as { messages: ChatMessage[] };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    // Get the latest user message for context lookup
    const latestUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const userText = latestUserMsg ? sanitizeMessage(latestUserMsg.content) : '';

    // Classify severity from the user's latest message
    const severity = classifySeverity(userText);

    // RAG: Fetch up to 5 related knowledge nodes for context enrichment
    let contextString = '';
    let sources: any[] = [];
    try {
      const relatedNodes = await queryNodes({ search: userText.slice(0, 100), limit: 5 });
      if (relatedNodes && relatedNodes.length > 0) {
        sources = relatedNodes.map((n: any) => ({
          id: n.id,
          title: n.title,
          node_type: n.node_type,
          summary: n.summary?.slice(0, 200)
        }));
        contextString = sources.map((n, i) =>
          `[KB-${i + 1}] ${n.title} (${n.node_type}): ${n.summary || 'No summary.'}`
        ).join('\n');
      }
    } catch (err) {
      console.error('RAG lookup failed for chatbot:', err);
      // Non-fatal — proceed without context
    }

    const nvidiaKey = process.env.NVIDIA_API_KEY;
    if (!nvidiaKey) {
      return NextResponse.json({ error: 'NVIDIA_API_KEY is not configured on the server.' }, { status: 503 });
    }

    // Build system prompt
    const systemPrompt = `You are SENTINEL, the CYBER TREE Incident Response AI.
You are an expert cybersecurity analyst specializing in incident communication, triage, and threat intelligence.

Your role is to:
1. Help analysts report, communicate, and understand security incidents clearly.
2. Ask clarifying questions to fully scope the incident (affected systems, timeline, indicators of compromise).
3. Provide structured, professional incident summaries using standard IR frameworks (NIST, MITRE ATT&CK).
4. Suggest immediate containment steps appropriate to the incident type and severity.
5. Reference the CYBER TREE Knowledge Base context below where relevant.
6. Always remain calm, precise, and professional.

Current incident severity classification: ${severity}

${contextString ? `CYBER TREE Knowledge Base Context:\n${contextString}\n` : ''}

Rules:
- Never fabricate IP addresses, CVE IDs, or specific technical details not provided by the analyst.
- If you reference a KB entry, cite it as [KB-N].
- Keep responses concise and actionable. Use markdown formatting with headers and bullet points.`;

    // Build sanitized conversation history
    const sanitizedMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.role === 'user' ? sanitizeMessage(m.content) : m.content.slice(0, 4000)
      })).slice(-10) // keep last 10 turns for context window
    ];

    const startTime = Date.now();

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nvidiaKey}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages: sanitizedMessages,
        temperature: 0.3,
        max_tokens: 1500,
        top_p: 0.8
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`NVIDIA API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response generated.';
    const query_time_ms = Date.now() - startTime;

    return NextResponse.json({ reply, severity, sources, query_time_ms });

  } catch (err: any) {
    return handleApiError(err, 'chat');
  }
}
