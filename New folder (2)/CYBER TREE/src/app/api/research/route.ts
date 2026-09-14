import { NextRequest, NextResponse } from 'next/server';
import { queryNodes, getFullTextSearch } from '@/lib/db';
import { getEmbedding } from '@/lib/embeddings';
import { checkAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const info = rateLimitMap.get(ip);
  if (!info) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }
  if (now > info.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }
  if (info.count >= 10) {
    return true;
  }
  info.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  
  const isAuthed = await checkAuth(req);
  if (!isAuthed) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 10 requests per minute.' },
      { status: 429 }
    );
  }

  const startTime = Date.now();
  try {
    const body = await req.json();
    const { question } = body;
    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    }

    // Prompt injection check
    const lowerQuestion = question.toLowerCase();
    const blacklist = [
      'system prompt', 'ignore previous', 'ignore instructions',
      'developer mode', 'you are now', 'dan mode', 'jailbreak', 'override'
    ];
    if (blacklist.some(keyword => lowerQuestion.includes(keyword))) {
      return NextResponse.json(
        { error: 'Potential prompt injection attempt blocked. Inputs with command keywords are not accepted.' },
        { status: 400 }
      );
    }

    // Step 1: Embed question
    let emb: number[] | null = null;
    try {
      const resEmb = await getEmbedding(question.trim());
      emb = resEmb.vector;
    } catch (err: any) {
      console.error('Embedding generation failed:', err);
    }

    // Step 2 & 3: Run queries concurrently
    const [vectorResults, ftsResults] = await Promise.all([
      emb ? queryNodes({
        semantic: true,
        embeddingVector: emb,
        threshold: 0.0,
        limit: 15,
        type: 'all'
      }) : Promise.resolve([]),
      getFullTextSearch(question.trim(), 10)
    ]);

    // Step 4: Merge & Rank
    const merged: Record<string, any> = {};

    for (const node of vectorResults) {
      const nid = node.id;
      const score = node.similarity ?? 0.0;
      merged[nid] = {
        ...node,
        score,
        sources_found: ['semantic']
      };
    }

    for (const node of ftsResults) {
      const nid = node.id;
      if (merged[nid]) {
        merged[nid].score += 0.2;
        merged[nid].sources_found.push('fts');
      } else {
        merged[nid] = {
          ...node,
          score: 0.7,
          sources_found: ['fts']
        };
      }
    }

    const rankedNodes = Object.values(merged);
    rankedNodes.sort((a, b) => b.score - a.score);
    const topNodes = rankedNodes.slice(0, 10);

    // Step 5: Build context string
    const contextParts = topNodes.map((node, idx) => {
      const summary = node.summary || '';
      const summaryTruncated = summary.trim().slice(0, 300);
      return `[${idx + 1}] (ID: ${node.id})\nTitle: ${node.title}\nType: ${node.node_type} | Confidence: ${(node.confidence ?? 0.5).toFixed(2)} | Relevance: ${node.score.toFixed(2)}\nSummary: ${summaryTruncated}\n`;
    });
    const contextString = contextParts.join('\n---\n');

    // Step 6: Call NVIDIA NIM API
    const nvidiaKey = process.env.NVIDIA_API_KEY;
    let answer = '';
    let apiError: string | null = null;

    if (!nvidiaKey) {
      apiError = 'NVIDIA_API_KEY is not configured on the server.';
    } else {
      const url = 'https://integrate.api.nvidia.com/v1/chat/completions';
      
      const systemInstruction = `You are the CYBER TREE Research Assistant, an expert AI security analyst.
Your goal is to answer the user's natural language question based strictly on the provided context nodes.
Follow these rules:
1. Rely ONLY on the information present in the context. Do not invent facts.
2. Cite every claim you make using the reference number, like [1], [2], corresponding to the context nodes.
3. If the context does not contain enough information to answer the question, clearly state that you don't have sufficient context, but synthesize whatever relevant information IS available.
4. Format your answer in clean Markdown.`;

      const prompt = `<retrieved_context>
Here is the retrieved context from the CYBER TREE knowledge base:
${contextString}
</retrieved_context>

<user_query>
User Question: ${question}
</user_query>

Please generate a detailed, sourced answer below.`;

      const payload = {
        model: 'meta/llama-3.1-70b-instruct',
        messages: [
          {
            role: 'system',
            content: systemInstruction
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2048,
        top_p: 0.7
      };

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${nvidiaKey}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`NVIDIA API returned status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        answer = data.choices?.[0]?.message?.content || '';
      } catch (err: any) {
        console.error('NVIDIA API call failed:', err);
        apiError = `AI Synthesis failed: ${err.message}`;
      }
    }

    const query_time_ms = Date.now() - startTime;

    // Prepare sources output
    const sources = topNodes.map((n) => ({
      id: n.id,
      title: n.title,
      node_type: n.node_type,
      confidence: n.confidence ?? 0.5,
      score: n.score,
      metadata: n.metadata
    }));

    return NextResponse.json({
      answer: answer || undefined,
      sources,
      query_time_ms,
      error: apiError || undefined
    });

  } catch (err: any) {
    console.error('API Research error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}
