import JSZip from 'jszip'

/**
 * Downloads all generated project files as an organized .zip archive in a single click,
 * preserving all directory hierarchies (e.g. prisma/, components/, public/, etc.)
 */
export async function downloadProjectZip(
  files: { path: string; content: string }[],
  projectName = 'ai-website-project'
) {
  if (!files || files.length === 0) return

  const zip = new JSZip()

  // Add each file into the zip preserving directory structures
  for (const file of files) {
    const cleanPath = file.path.replace(/^[/\\]+/, '')
    zip.file(cleanPath, file.content)
  }

  // Generate ZIP blob with compression
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  // Trigger browser download
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
