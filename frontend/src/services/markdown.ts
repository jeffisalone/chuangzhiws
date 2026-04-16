function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

function isSafeHref(value: string): boolean {
  const trimmed = value.trim().toLowerCase()

  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('#')
  )
}

function renderInline(source: string): string {
  const codeSpans: string[] = []
  let html = escapeHtml(source).replace(/`([^`]+)`/g, (_, code: string) => {
    const index = codeSpans.push(`<code>${code}</code>`) - 1

    return `@@CODE_SPAN_${index}@@`
  })

  html = html
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, href: string) => {
      const cleanHref = href.trim()

      if (!isSafeHref(cleanHref)) {
        return label
      }

      return `<a href="${escapeAttribute(cleanHref)}" target="_blank" rel="noreferrer">${label}</a>`
    })

  return html.replace(/@@CODE_SPAN_(\d+)@@/g, (_, index: string) => codeSpans[Number(index)] ?? '')
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function renderTable(lines: string[]): string {
  const header = splitTableRow(lines[0] ?? '')
  const rows = lines.slice(2).map((line) => splitTableRow(line))

  return [
    '<table>',
    '<thead><tr>',
    ...header.map((cell) => `<th>${renderInline(cell)}</th>`),
    '</tr></thead>',
    '<tbody>',
    ...rows.map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join('')}</tr>`),
    '</tbody>',
    '</table>',
  ].join('')
}

function isTableStart(lines: string[], index: number): boolean {
  const header = lines[index]
  const divider = lines[index + 1]

  return Boolean(
    header?.includes('|') &&
      divider?.includes('|') &&
      /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(divider),
  )
}

export function renderMarkdown(source: string): string {
  const normalized = source.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')
  const output: string[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index] ?? ''
    const trimmed = line.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    const fence = line.match(/^```(\w+)?\s*$/)

    if (fence) {
      const fenceLanguage = fence[1] ?? ''
      const language = fenceLanguage ? ` data-language="${escapeAttribute(fenceLanguage)}"` : ''
      const codeLines: string[] = []
      index += 1

      while (index < lines.length && !(lines[index] ?? '').startsWith('```')) {
        codeLines.push(lines[index] ?? '')
        index += 1
      }

      output.push(`<pre${language}><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
      index += 1
      continue
    }

    if (/^---+$/.test(trimmed)) {
      output.push('<hr>')
      index += 1
      continue
    }

    if (isTableStart(lines, index)) {
      const tableLines = [lines[index] ?? '', lines[index + 1] ?? '']
      index += 2

      while (index < lines.length && (lines[index] ?? '').includes('|') && (lines[index] ?? '').trim()) {
        tableLines.push(lines[index] ?? '')
        index += 1
      }

      output.push(renderTable(tableLines))
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/)

    if (heading) {
      const level = (heading[1] ?? '').length
      output.push(`<h${level}>${renderInline((heading[2] ?? '').trim())}</h${level}>`)
      index += 1
      continue
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = []

      while (index < lines.length && /^>\s?/.test(lines[index] ?? '')) {
        quoteLines.push((lines[index] ?? '').replace(/^>\s?/, ''))
        index += 1
      }

      output.push(`<blockquote>${renderMarkdown(quoteLines.join('\n'))}</blockquote>`)
      continue
    }

    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = []

      while (index < lines.length && /^[-*+]\s+/.test(lines[index] ?? '')) {
        items.push((lines[index] ?? '').replace(/^[-*+]\s+/, ''))
        index += 1
      }

      output.push(`<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`)
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []

      while (index < lines.length && /^\d+\.\s+/.test(lines[index] ?? '')) {
        items.push((lines[index] ?? '').replace(/^\d+\.\s+/, ''))
        index += 1
      }

      output.push(`<ol>${items.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ol>`)
      continue
    }

    const paragraph: string[] = []

    while (
      index < lines.length &&
      (lines[index] ?? '').trim() &&
      !/^```/.test(lines[index] ?? '') &&
      !/^(#{1,6})\s+/.test(lines[index] ?? '') &&
      !/^[-*+]\s+/.test(lines[index] ?? '') &&
      !/^\d+\.\s+/.test(lines[index] ?? '') &&
      !/^>\s?/.test(lines[index] ?? '') &&
      !isTableStart(lines, index)
    ) {
      paragraph.push(lines[index] ?? '')
      index += 1
    }

    output.push(`<p>${renderInline(paragraph.join(' '))}</p>`)
  }

  return output.join('\n')
}
