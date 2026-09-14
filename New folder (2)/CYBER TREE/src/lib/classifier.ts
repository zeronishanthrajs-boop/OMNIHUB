import fs from 'fs';
import path from 'path';

interface ClassifierWeights {
  classes: string[];
  vocabulary: Record<string, number>;
  idf: number[];
  coef: number[][];
  intercept: number[];
  sublinear_tf: boolean;
  ngram_range: [number, number];
}

let cachedWeights: ClassifierWeights | null = null;

function loadWeights(): ClassifierWeights {
  if (cachedWeights) return cachedWeights;
  try {
    const jsonPath = path.join(process.cwd(), 'models', 'classifier.json');
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    cachedWeights = JSON.parse(raw) as ClassifierWeights;
    return cachedWeights;
  } catch (err) {
    console.error('Failed to load classifier weights from models/classifier.json:', err);
    throw err;
  }
}

/**
 * Predicts node_type and confidence for a piece of text.
 * Falls back to keyword matching if weights file is not available.
 */
export function classifyText(text: string): { node_type: string; confidence: number } {
  if (!text || !text.trim()) {
    return { node_type: 'vulnerability', confidence: 0.0 };
  }

  let weights: ClassifierWeights;
  try {
    weights = loadWeights();
  } catch (err) {
    return runKeywordFallback(text);
  }

  const { classes, vocabulary, idf, coef, intercept, sublinear_tf, ngram_range } = weights;

  // 1. Tokenize: match standard word analyzer regex: \b\w\w+\b
  const cleanText = text.toLowerCase();
  const tokens = cleanText.match(/\b\w\w+\b/g) || [];

  // 2. Extract unigrams and bigrams
  const features: string[] = [];
  features.push(...tokens);
  if (ngram_range && ngram_range[1] > 1) {
    for (let i = 0; i < tokens.length - 1; i++) {
      features.push(`${tokens[i]} ${tokens[i + 1]}`);
    }
  }

  // 3. Count frequencies of words in vocabulary
  const counts: Record<string, number> = {};
  for (const feat of features) {
    if (feat in vocabulary) {
      counts[feat] = (counts[feat] || 0) + 1;
    }
  }

  // 4. Build TF-IDF vector
  const vocabSize = Object.keys(vocabulary).length;
  const vector = new Array(vocabSize).fill(0);
  for (const feat in counts) {
    const idx = vocabulary[feat];
    let tf = counts[feat];
    if (sublinear_tf) {
      tf = 1.0 + Math.log(tf);
    }
    vector[idx] = tf * idf[idx];
  }

  // 5. L2 Normalize vector
  let sumSq = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= norm;
    }
  }

  // 6. Logistic Regression computation: score = W * x + b
  const numClasses = classes.length;
  const scores = new Array(numClasses).fill(0);
  for (let c = 0; c < numClasses; c++) {
    let score = intercept[c];
    const coefRow = coef[c];
    for (let i = 0; i < vector.length; i++) {
      score += coefRow[i] * vector[i];
    }
    scores[c] = score;
  }

  // 7. Softmax to get probabilities
  const maxScore = Math.max(...scores);
  const expScores = scores.map(s => Math.exp(s - maxScore));
  const sumExp = expScores.reduce((a, b) => a + b, 0);
  const probs = expScores.map(es => es / sumExp);

  // 8. Argmax to get highest probability class
  let maxIdx = 0;
  let maxProb = 0;
  for (let i = 0; i < probs.length; i++) {
    if (probs[i] > maxProb) {
      maxProb = probs[i];
      maxIdx = i;
    }
  }

  return {
    node_type: classes[maxIdx],
    confidence: parseFloat(maxProb.toFixed(4)),
  };
}

function runKeywordFallback(text: string): { node_type: string; confidence: number } {
  const combined = text.toLowerCase();
  let pred = 'vulnerability';

  if (/cve-\d{4}-\d{4,7}/.test(combined)) {
    pred = 'vulnerability';
  } else if (['apt', 'threat actor', 'intrusion set', 'lazarus', 'fancy bear', 'cozy bear', 'sandworm', 'lockbit', 'alphv'].some(actor => combined.includes(actor))) {
    pred = 'threat_actor';
  } else if (['malware', 'ransomware', 'trojan', 'spyware', 'backdoor', 'rootkit', 'worm', 'stealer', 'loader'].some(mw => combined.includes(mw))) {
    pred = 'malware';
  } else if (['technique', 'ttp', 'mitre attack', 'initial access', 'privilege escalation', 'lateral movement'].some(tq => combined.includes(tq))) {
    pred = 'technique';
  } else if (['cwe-', 'weakness', 'owasp', 'sql injection', 'cross-site scripting', 'xss'].some(wk => combined.includes(wk))) {
    pred = 'weakness';
  } else if (['tool', 'utility', 'software', 'framework', 'library', 'platform'].some(t => combined.includes(t))) {
    pred = 'tool';
  } else if (['interpol', 'fbi', 'doj', 'seizes', 'seize', 'arrests', 'arrested', 'takedown', 'disrupts', 'court', 'sues', 'indictment', 'law enforcement', 'bulletin', 'advisory'].some(ns => combined.includes(ns))) {
    pred = 'news';
  } else if (['opinion', 'commentary', 'analysis', 'mistake', 'sprawl', 'worries', 'worry', 'study', 'survey', 'report', 'trends', 'ciso', 'cybersecurity storytelling', 'slop', 'vibe'].some(rs => combined.includes(rs))) {
    pred = 'research';
  }

  return {
    node_type: pred,
    confidence: 0.7000,
  };
}
