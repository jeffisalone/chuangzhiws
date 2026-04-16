<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { AuthRequestError, type AuthUser } from '../services/auth'
import { streamDamingbaiChat, type AiMessage } from '../services/ai'
import { renderMarkdown } from '../services/markdown'

type ChatItem = {
  id: number
  role: 'user' | 'assistant'
  content: string
}

const props = defineProps<{
  user: AuthUser
  isVerifyingSession: boolean
}>()

const emit = defineEmits<{
  verify: []
  backDashboard: []
}>()

const input = ref('')
const messages = ref<ChatItem[]>([
  {
    id: 1,
    role: 'assistant',
    content: '我是大明白。把问题说清楚，我会直接给你可执行的步骤、代码思路或排查路径。',
  },
])
const isStreaming = ref(false)
const errorMessage = ref('')
const tokenUsage = ref<number | null>(null)
const outputRef = ref<HTMLElement | null>(null)
let nextMessageId = 2
let activeController: AbortController | null = null

const canSend = computed(() => input.value.trim().length > 0 && !isStreaming.value)
const levelLabel = computed(() => `Lv.${props.user.level}`)

const renderAssistantMessage = (content: string): string => {
  return content.trim() ? renderMarkdown(content) : '<p>正在输出...</p>'
}

const scrollToBottom = () => {
  void nextTick(() => {
    if (outputRef.value) {
      outputRef.value.scrollTop = outputRef.value.scrollHeight
    }
  })
}

const buildPayload = (): AiMessage[] =>
  messages.value
    .filter((message) => message.content.trim())
    .slice(-18)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))

const stopStreaming = () => {
  activeController?.abort()
  activeController = null
  isStreaming.value = false
}

const sendMessage = async () => {
  const content = input.value.trim()

  if (!content || isStreaming.value) {
    return
  }

  const userMessage: ChatItem = {
    id: nextMessageId,
    role: 'user',
    content,
  }
  nextMessageId += 1

  const assistantMessage: ChatItem = {
    id: nextMessageId,
    role: 'assistant',
    content: '',
  }
  nextMessageId += 1

  messages.value.push(userMessage, assistantMessage)
  input.value = ''
  errorMessage.value = ''
  tokenUsage.value = null
  isStreaming.value = true
  activeController = new AbortController()
  scrollToBottom()

  try {
    await streamDamingbaiChat(
      buildPayload(),
      (chunk) => {
        if (chunk.type === 'delta' && chunk.content) {
          assistantMessage.content += chunk.content
          scrollToBottom()
        }

        if (chunk.type === 'completed') {
          tokenUsage.value = chunk.token_usage ?? null
          isStreaming.value = false
        }

        if (chunk.type === 'error') {
          errorMessage.value = chunk.content ?? 'AI 响应失败，请稍后重试'
          isStreaming.value = false
        }
      },
      activeController.signal,
    )
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      errorMessage.value = '已停止本次输出'
    } else if (error instanceof AuthRequestError && error.status === 401) {
      errorMessage.value = '登录状态已失效，请重新登录后继续使用大明白。'
      emit('verify')
    } else {
      errorMessage.value = error instanceof Error ? error.message : 'AI 请求失败，请稍后重试'
    }
  } finally {
    isStreaming.value = false
    activeController = null

    if (!assistantMessage.content.trim()) {
      assistantMessage.content = errorMessage.value || '本次没有收到有效回复。'
    }

    scrollToBottom()
  }
}

onBeforeUnmount(() => {
  stopStreaming()
})
</script>

<template>
  <section class="damingbai-page" aria-labelledby="damingbai-title">
    <div class="damingbai-inner">
      <header class="damingbai-heading">
        <div>
          <p class="eyebrow dark">Damingbai AI</p>
          <h1 id="damingbai-title">大明白</h1>
          <p>面向课程、项目、排错和复盘的即时助手。</p>
        </div>
        <div class="assistant-meta" aria-label="当前用户">
          <span :class="{ checking: isVerifyingSession }"></span>
          <strong>{{ user.accountName }}</strong>
          <small>{{ levelLabel }} · {{ user.experience }} EXP</small>
        </div>
      </header>

      <div class="assistant-layout">
        <aside class="assistant-brief" aria-label="提示">
          <h2>可直接问</h2>
          <button type="button" @click="input = '帮我把这个项目拆成三天能完成的任务清单'">
            项目拆解
          </button>
          <button type="button" @click="input = '这段接口报错应该按什么顺序排查？'">
            接口排查
          </button>
          <button type="button" @click="input = '帮我写一份技术复盘，突出失败原因和下一步'">
            失败复盘
          </button>
          <div class="brief-status">
            <strong>{{ isVerifyingSession ? '验证中' : '登录已验证' }}</strong>
            <span>调用前会检查会话状态，AI 密钥只保存在后端。</span>
          </div>
          <button class="dashboard-link" type="button" @click="emit('backDashboard')">
            返回 Dashboard
          </button>
        </aside>

        <div class="assistant-console">
          <div ref="outputRef" class="message-stream" aria-live="polite">
            <article
              v-for="message in messages"
              :key="message.id"
              class="message"
              :class="`message-${message.role}`"
            >
              <span>{{ message.role === 'user' ? '你' : '大明白' }}</span>
              <div
                v-if="message.role === 'assistant'"
                class="message-content markdown-message"
                v-html="renderAssistantMessage(message.content)"
              ></div>
              <div v-else class="message-content plain-message">
                {{ message.content || '正在输出...' }}
              </div>
            </article>
          </div>

          <form class="composer" @submit.prevent="sendMessage">
            <textarea
              v-model="input"
              rows="3"
              placeholder="输入你要解决的问题，按 Enter 发送，Shift + Enter 换行"
              :disabled="isStreaming"
              @keydown.enter.exact.prevent="sendMessage"
            ></textarea>
            <div class="composer-actions">
              <p v-if="errorMessage" class="composer-error">{{ errorMessage }}</p>
              <p v-else-if="tokenUsage !== null" class="composer-usage">
                本次对话 token 用量：{{ tokenUsage }}
              </p>
              <p v-else>模型：Qwen3-235B-A22B-Instruct-2507</p>
              <button v-if="isStreaming" type="button" @click="stopStreaming">停止</button>
              <button v-else type="submit" :disabled="!canSend">发送</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.damingbai-page {
  min-height: 100vh;
  padding: 128px clamp(20px, 7vw, 96px) 76px;
  background:
    linear-gradient(180deg, #f6f8f7 0%, #ffffff 48%),
    #ffffff;
  color: #101214;
}

.damingbai-inner {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.damingbai-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 22px;
}

.damingbai-heading h1 {
  margin: 0;
  color: #101214;
  font-size: 64px;
  line-height: 1.02;
  letter-spacing: 0;
}

.damingbai-heading p {
  margin: 12px 0 0;
  color: #5b6168;
  font-size: 20px;
  line-height: 1.7;
}

.assistant-meta {
  display: grid;
  min-width: 190px;
  gap: 4px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.assistant-meta span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 rgba(34, 197, 94, 0.46);
  animation: aiBreath 1.8s ease-in-out infinite;
}

.assistant-meta span.checking {
  background: #2563eb;
  animation-duration: 0.9s;
}

.assistant-meta strong {
  color: #101214;
  font-size: 18px;
}

.assistant-meta small {
  color: #5b6168;
  font-weight: 800;
}

.assistant-layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 22px;
  margin-top: 34px;
}

.assistant-brief {
  align-self: start;
  display: grid;
  gap: 12px;
  padding: 22px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.assistant-brief h2 {
  margin: 0 0 6px;
  color: #101214;
  font-size: 26px;
  line-height: 1.1;
}

.assistant-brief button,
.composer-actions button {
  min-height: 42px;
  border-radius: 8px;
  font-weight: 900;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.assistant-brief button {
  padding: 0 14px;
  background: #f3f4f6;
  color: #101214;
  text-align: left;
}

.assistant-brief button:hover,
.composer-actions button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.brief-status {
  display: grid;
  gap: 6px;
  margin-top: 8px;
  padding-top: 18px;
  border-top: 1px solid #e5e7eb;
}

.brief-status strong {
  color: #101214;
}

.brief-status span {
  color: #5b6168;
  font-size: 13px;
  line-height: 1.6;
}

.assistant-brief .dashboard-link {
  margin-top: 4px;
  background: #101214;
  color: #ffffff;
  text-align: center;
}

.assistant-console {
  display: grid;
  min-height: 660px;
  grid-template-rows: minmax(0, 1fr) auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #101214;
  overflow: hidden;
}

.message-stream {
  display: grid;
  align-content: start;
  gap: 18px;
  min-height: 0;
  padding: 24px;
  overflow-y: auto;
}

.message {
  display: grid;
  gap: 8px;
  width: min(760px, 100%);
}

.message-user {
  justify-self: end;
}

.message span {
  color: rgba(255, 255, 255, 0.56);
  font-size: 12px;
  font-weight: 900;
}

.message-content {
  margin: 0;
  padding: 14px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  line-height: 1.75;
}

.plain-message {
  white-space: pre-wrap;
}

.message-user .message-content {
  background: #ffffff;
  color: #101214;
}

.markdown-message :deep(h1),
.markdown-message :deep(h2),
.markdown-message :deep(h3),
.markdown-message :deep(h4),
.markdown-message :deep(h5),
.markdown-message :deep(h6) {
  margin: 0.95em 0 0.45em;
  color: #ffffff;
  line-height: 1.2;
  letter-spacing: 0;
}

.markdown-message :deep(h1:first-child),
.markdown-message :deep(h2:first-child),
.markdown-message :deep(h3:first-child),
.markdown-message :deep(p:first-child),
.markdown-message :deep(pre:first-child),
.markdown-message :deep(ul:first-child),
.markdown-message :deep(ol:first-child),
.markdown-message :deep(blockquote:first-child) {
  margin-top: 0;
}

.markdown-message :deep(h1) {
  font-size: 30px;
}

.markdown-message :deep(h2) {
  font-size: 24px;
}

.markdown-message :deep(h3) {
  font-size: 20px;
}

.markdown-message :deep(p),
.markdown-message :deep(ul),
.markdown-message :deep(ol),
.markdown-message :deep(blockquote),
.markdown-message :deep(pre),
.markdown-message :deep(table) {
  margin: 0 0 14px;
}

.markdown-message :deep(p:last-child),
.markdown-message :deep(ul:last-child),
.markdown-message :deep(ol:last-child),
.markdown-message :deep(blockquote:last-child),
.markdown-message :deep(pre:last-child),
.markdown-message :deep(table:last-child) {
  margin-bottom: 0;
}

.markdown-message :deep(p),
.markdown-message :deep(li) {
  color: rgba(255, 255, 255, 0.9);
}

.markdown-message :deep(ul),
.markdown-message :deep(ol) {
  padding-left: 1.35em;
}

.markdown-message :deep(a) {
  color: #93c5fd;
  font-weight: 900;
}

.markdown-message :deep(code) {
  padding: 2px 5px;
  border-radius: 6px;
  background: rgba(147, 197, 253, 0.16);
  color: #bfdbfe;
}

.markdown-message :deep(pre) {
  overflow: auto;
  padding: 14px;
  border-radius: 8px;
  background: #050808;
  color: #ffffff;
}

.markdown-message :deep(pre code) {
  padding: 0;
  background: transparent;
  color: inherit;
}

.markdown-message :deep(blockquote) {
  padding: 10px 14px;
  border-left: 4px solid #93c5fd;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
}

.markdown-message :deep(table) {
  width: 100%;
  border-collapse: collapse;
}

.markdown-message :deep(th),
.markdown-message :deep(td) {
  padding: 9px 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  text-align: left;
}

.markdown-message :deep(th) {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.markdown-message :deep(hr) {
  margin: 18px 0;
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
}

.composer {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  background: #161a1d;
}

.composer textarea {
  width: 100%;
  min-height: 86px;
  resize: vertical;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  outline: none;
  background: #0b0d0f;
  color: #ffffff;
  font: inherit;
  line-height: 1.6;
}

.composer textarea:focus {
  border-color: rgba(34, 197, 94, 0.72);
}

.composer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.composer-actions p {
  margin: 0;
  color: rgba(255, 255, 255, 0.58);
  font-size: 13px;
  font-weight: 800;
}

.composer-actions .composer-error {
  color: #fecaca;
}

.composer-actions .composer-usage {
  color: #bbf7d0;
}

.composer-actions button {
  min-width: 94px;
  padding: 0 18px;
  background: #22c55e;
  color: #062d16;
}

.composer-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
}

@keyframes aiBreath {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.46);
    transform: scale(0.94);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
    transform: scale(1);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
    transform: scale(0.94);
  }
}

@media (max-width: 860px) {
  .damingbai-page {
    padding: 110px 20px 60px;
  }

  .damingbai-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .damingbai-heading h1 {
    font-size: 42px;
  }

  .assistant-layout {
    grid-template-columns: 1fr;
  }

  .assistant-console {
    min-height: 620px;
  }

  .composer-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .composer-actions button {
    width: 100%;
  }
}
</style>
