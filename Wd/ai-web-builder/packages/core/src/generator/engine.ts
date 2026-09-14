import { nanoid } from 'nanoid'
import { type GenerationRequest, type GenerationResult, type GeneratedFile } from './types'
import { buildSystemPrompt, buildGenerationPrompt } from './prompt'
import { applyLayers } from '../layers/applier'
import { globalProviderRegistry } from '../providers/registry'

function parseGeneratedFiles(text: string): GeneratedFile[] {
  const files: GeneratedFile[] = []
  const seenPaths = new Set<string>()

  const languageMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    css: 'css', html: 'html', json: 'json', md: 'markdown',
    prisma: 'prisma', sql: 'sql', yml: 'yaml', yaml: 'yaml',
    config: 'json', toml: 'toml', dockerfile: 'dockerfile',
  }

  function addFile(path: string, content: string) {
    const cleanPath = path.trim().replace(/^['"`]+|['"`]+$/g, '').replace(/^[\\/]+/, '')
    if (!cleanPath || seenPaths.has(cleanPath)) return
    const ext = cleanPath.split('.').pop()?.toLowerCase() || ''
    seenPaths.add(cleanPath)
    files.push({
      path: cleanPath,
      content: content.trim(),
      language: languageMap[ext] || ext || 'plaintext',
    })
  }

  // 1. ```file:<path> or ```file: <path>
  const fileTagRegex = /```file:\s*([^\n\r]+)\r?\n([\s\S]*?)(?:```|$)/g
  let match: RegExpExecArray | null
  while ((match = fileTagRegex.exec(text)) !== null) {
    addFile(match[1], match[2])
  }

  // 2. ```lang:path or ```lang filename="path" or ```lang file="path"
  const langAttrRegex = /```(?:[a-zA-Z0-9_-]+)?(?::|\s+(?:filename|file|name)=)\s*["']?([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)["']?\r?\n([\s\S]*?)(?:```|$)/g
  while ((match = langAttrRegex.exec(text)) !== null) {
    addFile(match[1], match[2])
  }

  // 3. **filename.ext** or ### filename.ext or File: filename.ext followed by ```lang
  const headerFileRegex = /(?:(?:\*\*|`|###|##|#|File:\s*|Path:\s*)\s*([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)(?:\*\*|`)?)\s*\r?\n\s*```(?:[a-zA-Z0-9_-]+)?\r?\n([\s\S]*?)(?:```|$)/g
  while ((match = headerFileRegex.exec(text)) !== null) {
    addFile(match[1], match[2])
  }

  // 4. Comment inside code fence: ```lang \n // filename.ext or <!-- filename.ext -->
  const codeCommentRegex = /```([a-zA-Z0-9_-]+)?\r?\n\s*(?:\/\/|#|\/\*|<!--)\s*([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)(?:\s*\*\/|\s*-->)?\r?\n([\s\S]*?)(?:```|$)/g
  while ((match = codeCommentRegex.exec(text)) !== null) {
    addFile(match[2], match[3])
  }

  // 5. Fallback: Parse generic code fences if no named files matched
  if (files.length === 0) {
    const genericFenceRegex = /```([a-zA-Z0-9_-]+)?\r?\n([\s\S]*?)(?:```|$)/g
    let fallbackIndex = 1
    while ((match = genericFenceRegex.exec(text)) !== null) {
      const lang = (match[1] || '').toLowerCase().trim()
      const content = match[2].trim()
      if (!content) continue
      let filename = ''
      if (lang === 'html' || content.includes('<!DOCTYPE') || content.includes('<html')) {
        filename = fallbackIndex === 1 ? 'index.html' : `page-${fallbackIndex}.html`
      } else if (lang === 'css') {
        filename = fallbackIndex === 1 ? 'style.css' : `style-${fallbackIndex}.css`
      } else if (lang === 'javascript' || lang === 'js') {
        filename = fallbackIndex === 1 ? 'script.js' : `script-${fallbackIndex}.js`
      } else if (lang === 'typescript' || lang === 'ts' || lang === 'tsx') {
        filename = fallbackIndex === 1 ? 'app/page.tsx' : `component-${fallbackIndex}.tsx`
      } else if (lang === 'json') {
        filename = 'package.json'
      } else {
        filename = `file-${fallbackIndex}.txt`
      }
      fallbackIndex++
      addFile(filename, content)
    }
  }

  // 6. Raw HTML fallback if still empty
  if (files.length === 0) {
    const htmlMatch = text.match(/<!DOCTYPE html[\s\S]*?<\/html>/i) || text.match(/<html[\s\S]*?<\/html>/i)
    if (htmlMatch) {
      addFile('index.html', htmlMatch[0])
    }
  }

  // 7. Ultimate fallback: If the model returned markdown / text without code blocks, preserve it as a readable file
  if (files.length === 0 && text.trim().length > 0) {
    addFile('README.md', text.trim())
  }

  return files
}

export async function generateSite(request: GenerationRequest): Promise<GenerationResult> {
  const startTime = Date.now()
  const provider = globalProviderRegistry.get(request.providerId)
  if (!provider) throw new Error(`Provider "${request.providerId}" not found`)

  const layerResult = applyLayers({
    layers: request.layers,
    siteConfig: request.siteConfig,
  })

  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildGenerationPrompt(
    request.siteConfig,
    request.layers,
    request.prompt,
    request.clonedContext,
  )

  const response = await provider.chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    model: request.model,
    temperature: request.temperature,
    maxTokens: request.maxTokens,
  })

  const files = parseGeneratedFiles(response.content)

  return {
    id: nanoid(12),
    siteConfig: request.siteConfig,
    layers: request.layers,
    files,
    stdout: response.content,
    model: response.model,
    provider: request.providerId,
    duration: Date.now() - startTime,
    tokenUsage: response.usage,
  }
}

export async function* streamGenerateSite(
  request: GenerationRequest,
): AsyncGenerator<{ type: 'token' | 'file' | 'done' | 'error'; data: any }> {
  const startTime = Date.now()
  const provider = globalProviderRegistry.get(request.providerId)
  if (!provider) {
    yield { type: 'error', data: `Provider "${request.providerId}" not found` }
    return
  }

  const layerResult = applyLayers({
    layers: request.layers,
    siteConfig: request.siteConfig,
  })

  yield { type: 'done', data: { layersConfigured: layerResult.layers.length, prompts: layerResult.prompts } }

  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildGenerationPrompt(
    request.siteConfig,
    request.layers,
    request.prompt,
    request.clonedContext,
  )

  let fullText = ''
  try {
    const stream = provider.streamChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      model: request.model,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    })

    for await (const token of stream) {
      fullText += token
      yield { type: 'token', data: token }
    }

    const files = parseGeneratedFiles(fullText)
    yield { type: 'done', data: { files, duration: Date.now() - startTime } }
  } catch (err: any) {
    yield { type: 'error', data: err.message }
  }
}
