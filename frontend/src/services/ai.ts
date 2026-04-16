import { API_BASE_URL, AuthRequestError } from './auth'

export type AiRole = 'system' | 'user' | 'assistant'

export type AiMessage = {
  role: AiRole
  content: string
}

export type AiStreamChunk = {
  type: 'delta' | 'completed' | 'error'
  content?: string
  token_usage?: number
}

export type PromptAssistantKind = 'auto' | 'image' | 'video'

type AiErrorResponse = {
  success: false
  errors?: Array<{
    code: string
    message: string
  }>
}

function getErrorMessage(body: AiErrorResponse | null, fallback: string): string {
  return body?.errors?.[0]?.message ?? fallback
}

export async function streamDamingbaiChat(
  messages: AiMessage[],
  onChunk: (chunk: AiStreamChunk) => void,
  signal?: AbortSignal,
): Promise<void> {
  return streamNdjsonResponse('/ai/chat', { messages }, onChunk, signal)
}

export async function streamPromptAssistant(
  prompt: string,
  kind: PromptAssistantKind,
  onChunk: (chunk: AiStreamChunk) => void,
  signal?: AbortSignal,
): Promise<void> {
  return streamNdjsonResponse('/ai/prompt-assistant', { prompt, kind }, onChunk, signal)
}

async function streamNdjsonResponse(
  path: '/ai/chat' | '/ai/prompt-assistant',
  payload: Record<string, unknown>,
  onChunk: (chunk: AiStreamChunk) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/x-ndjson',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
    signal,
  })

  if (!response.ok) {
    let body: AiErrorResponse | null = null

    try {
      body = (await response.json()) as AiErrorResponse
    } catch {
      body = null
    }

    throw new AuthRequestError(getErrorMessage(body, 'AI 请求失败，请稍后重试'), response.status)
  }

  if (!response.body) {
    throw new Error('AI 响应流不可用')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const processLine = (line: string) => {
    const trimmed = line.trim()

    if (!trimmed) {
      return
    }

    try {
      onChunk(JSON.parse(trimmed) as AiStreamChunk)
    } catch {
      onChunk({ type: 'delta', content: trimmed })
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        processLine(line)
      }
    }

    if (buffer.trim()) {
      processLine(buffer)
    }
  } finally {
    reader.releaseLock()
  }
}
