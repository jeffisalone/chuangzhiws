<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { AuthRequestError, type AuthUser } from '../services/auth'
import {
  streamPromptAssistant,
  type PromptAssistantKind,
} from '../services/ai'
import { renderMarkdown } from '../services/markdown'

const props = defineProps<{
  user: AuthUser
  isVerifyingSession: boolean
}>()

const emit = defineEmits<{
  verify: []
  backDashboard: []
}>()

const promptInput = ref('')
const promptKind = ref<PromptAssistantKind>('auto')
const result = ref('')
const errorMessage = ref('')
const tokenUsage = ref<number | null>(null)
const isGenerating = ref(false)
const isWaitingForFirstChunk = ref(false)
const copyState = ref('')
let activeController: AbortController | null = null
let copyTimer: number | undefined

const canGenerate = computed(() => promptInput.value.trim().length > 0 && !isGenerating.value)
const levelLabel = computed(() => `Lv.${props.user.level}`)
const renderedResult = computed(() =>
  result.value.trim() ? renderMarkdown(result.value) : '',
)
const loadingLabel = computed(() =>
  isWaitingForFirstChunk.value ? '正在分析提示词结构' : '正在优化专业细节',
)

const examples = [
  {
    label: '赛博城市',
    kind: 'image',
    text: '雨夜赛博朋克城市，一个穿黑色风衣的人站在霓虹灯下',
  },
  {
    label: '校园宣传片',
    kind: 'video',
    text: '吉林交通职业技术学院学生在创智工坊做机器人项目的视频',
  },
  {
    label: '国风角色',
    kind: 'image',
    text: '白发侠客站在雪山上，电影感',
  },
] satisfies Array<{ label: string; kind: PromptAssistantKind; text: string }>

const selectExample = (example: (typeof examples)[number]) => {
  promptInput.value = example.text
  promptKind.value = example.kind
}

const stopGenerating = () => {
  activeController?.abort()
  activeController = null
  isGenerating.value = false
  isWaitingForFirstChunk.value = false
}

const generatePrompt = async () => {
  const prompt = promptInput.value.trim()

  if (!prompt || isGenerating.value) {
    return
  }

  result.value = ''
  errorMessage.value = ''
  tokenUsage.value = null
  copyState.value = ''
  isGenerating.value = true
  isWaitingForFirstChunk.value = true
  activeController = new AbortController()

  try {
    await streamPromptAssistant(
      prompt,
      promptKind.value,
      (chunk) => {
        if (chunk.type === 'delta' && chunk.content) {
          isWaitingForFirstChunk.value = false
          result.value += chunk.content
        }

        if (chunk.type === 'completed') {
          tokenUsage.value = chunk.token_usage ?? null
          isGenerating.value = false
          isWaitingForFirstChunk.value = false
        }

        if (chunk.type === 'error') {
          errorMessage.value = chunk.content ?? '提示词优化失败，请稍后重试'
          isGenerating.value = false
          isWaitingForFirstChunk.value = false
        }
      },
      activeController.signal,
    )
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      errorMessage.value = '已停止本次优化'
    } else if (error instanceof AuthRequestError && error.status === 401) {
      errorMessage.value = '登录状态已失效，请重新登录后继续使用提示词助手。'
      emit('verify')
    } else {
      errorMessage.value = error instanceof Error ? error.message : '提示词优化失败，请稍后重试'
    }
  } finally {
    isGenerating.value = false
    isWaitingForFirstChunk.value = false
    activeController = null
  }
}

const copyResult = async () => {
  if (!result.value.trim() || isGenerating.value) {
    return
  }

  try {
    await navigator.clipboard.writeText(result.value)
    copyState.value = '已复制'
  } catch {
    copyState.value = '复制失败'
  }

  window.clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => {
    copyState.value = ''
  }, 1800)
}

onBeforeUnmount(() => {
  stopGenerating()
  window.clearTimeout(copyTimer)
})
</script>

<template>
  <section class="prompt-page" aria-labelledby="prompt-title">
    <div class="prompt-inner">
      <header class="prompt-heading">
        <div>
          <p class="eyebrow dark">CO-STAR Prompt Lab</p>
          <h1 id="prompt-title">提示词助手</h1>
          <p>把一句简单想法改成专业图片或视频生成提示词。</p>
        </div>
        <div class="assistant-meta" aria-label="当前用户">
          <span :class="{ checking: isVerifyingSession }"></span>
          <strong>{{ user.accountName }}</strong>
          <small>{{ levelLabel }} · {{ user.experience }} EXP</small>
        </div>
      </header>

      <div class="prompt-workbench">
        <form class="prompt-input-panel" @submit.prevent="generatePrompt">
          <div class="field-head">
            <h2>输入简单提示词</h2>
            <p>系统会按 CO-STAR 框架补齐主体、镜头、光影、风格、限制和参数建议。</p>
          </div>

          <div class="kind-switch" aria-label="生成类型">
            <button
              type="button"
              :class="{ active: promptKind === 'auto' }"
              @click="promptKind = 'auto'"
            >
              自动判断
            </button>
            <button
              type="button"
              :class="{ active: promptKind === 'image' }"
              @click="promptKind = 'image'"
            >
              图片
            </button>
            <button
              type="button"
              :class="{ active: promptKind === 'video' }"
              @click="promptKind = 'video'"
            >
              视频
            </button>
          </div>

          <textarea
            v-model="promptInput"
            rows="9"
            placeholder="例如：雨夜未来城市，一个女孩拿着透明雨伞走过霓虹街道"
            :disabled="isGenerating"
          ></textarea>

          <div class="example-row" aria-label="示例提示词">
            <button
              v-for="example in examples"
              :key="example.label"
              type="button"
              :disabled="isGenerating"
              @click="selectExample(example)"
            >
              {{ example.label }}
            </button>
          </div>

          <div class="prompt-actions">
            <p v-if="errorMessage" class="prompt-error">{{ errorMessage }}</p>
            <p v-else-if="tokenUsage !== null" class="prompt-usage">
              本次优化 token 用量：{{ tokenUsage }}
            </p>
            <p v-else>模型：stepfun-ai/Step-3.5-Flash</p>
            <div class="action-buttons">
              <button v-if="isGenerating" type="button" class="stop-button" @click="stopGenerating">
                停止
              </button>
              <button v-else type="submit" class="generate-button" :disabled="!canGenerate">
                优化提示词
              </button>
            </div>
          </div>

          <button class="dashboard-link" type="button" @click="emit('backDashboard')">
            返回 Dashboard
          </button>
        </form>

        <section class="prompt-output-panel" aria-labelledby="result-title" aria-live="polite">
          <div class="result-toolbar">
            <div>
              <span>Output</span>
              <h2 id="result-title">优化结果</h2>
            </div>
            <button type="button" :disabled="!result.trim() || isGenerating" @click="copyResult">
              {{ copyState || '复制' }}
            </button>
          </div>

          <div v-if="isGenerating && !result.trim()" class="loading-state">
            <span class="loading-spinner" aria-hidden="true"></span>
            <strong>{{ loadingLabel }}</strong>
            <p>正在组织类型判断、完整提示词、负面提示词和参数建议。</p>
          </div>

          <div
            v-else-if="result.trim()"
            class="result-content markdown-message"
            v-html="renderedResult"
          ></div>

          <div v-else class="empty-state">
            <strong>等待输入</strong>
            <p>生成后会在这里返回可直接使用的专业提示词。</p>
          </div>

          <div v-if="isGenerating && result.trim()" class="streaming-bar">
            <span class="loading-spinner small" aria-hidden="true"></span>
            <p>{{ loadingLabel }}</p>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
.prompt-page {
  min-height: 100vh;
  padding: 128px clamp(20px, 7vw, 96px) 76px;
  background: #f6f8f7;
  color: #101214;
}

.prompt-inner {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.prompt-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 22px;
}

.prompt-heading h1 {
  margin: 0;
  color: #101214;
  font-size: 64px;
  line-height: 1.02;
  letter-spacing: 0;
}

.prompt-heading p {
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
  animation: promptBreath 1.8s ease-in-out infinite;
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

.prompt-workbench {
  display: grid;
  grid-template-columns: minmax(300px, 0.82fr) minmax(0, 1.18fr);
  gap: 22px;
  margin-top: 34px;
}

.prompt-input-panel,
.prompt-output-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.prompt-input-panel {
  display: grid;
  align-self: start;
  gap: 18px;
  padding: 22px;
}

.field-head h2,
.result-toolbar h2 {
  margin: 0;
  color: #101214;
  font-size: 28px;
  line-height: 1.12;
  letter-spacing: 0;
}

.field-head p {
  margin: 8px 0 0;
  color: #5b6168;
  line-height: 1.65;
}

.kind-switch {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.kind-switch button,
.example-row button,
.prompt-actions button,
.dashboard-link,
.result-toolbar button {
  min-height: 42px;
  border-radius: 8px;
  font-weight: 900;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.kind-switch button {
  background: #eef2f7;
  color: #101214;
}

.kind-switch button.active {
  background: #101214;
  color: #ffffff;
}

.prompt-input-panel textarea {
  width: 100%;
  min-height: 210px;
  resize: vertical;
  padding: 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  background: #ffffff;
  color: #101214;
  font: inherit;
  line-height: 1.7;
}

.prompt-input-panel textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.prompt-input-panel textarea:disabled {
  cursor: wait;
  background: #f3f4f6;
}

.example-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.example-row button {
  padding: 0 12px;
  background: #f3f4f6;
  color: #101214;
}

.kind-switch button:hover,
.example-row button:hover:not(:disabled),
.prompt-actions button:hover:not(:disabled),
.dashboard-link:hover,
.result-toolbar button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.prompt-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.prompt-actions p {
  margin: 0;
  color: #5b6168;
  font-size: 13px;
  font-weight: 800;
}

.prompt-actions .prompt-error {
  color: #b91c1c;
}

.prompt-actions .prompt-usage {
  color: #166534;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.generate-button {
  min-width: 116px;
  padding: 0 18px;
  background: #2563eb;
  color: #ffffff;
}

.stop-button {
  min-width: 92px;
  padding: 0 18px;
  background: #101214;
  color: #ffffff;
}

.prompt-actions button:disabled,
.result-toolbar button:disabled,
.example-row button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  transform: none;
}

.dashboard-link {
  width: 100%;
  background: #101214;
  color: #ffffff;
}

.prompt-output-panel {
  display: grid;
  min-height: 650px;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
}

.result-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  border-bottom: 1px solid #e5e7eb;
}

.result-toolbar span {
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.result-toolbar button {
  min-width: 76px;
  padding: 0 14px;
  background: #eef2f7;
  color: #101214;
}

.result-content,
.empty-state,
.loading-state {
  min-height: 0;
  padding: 22px;
  overflow-y: auto;
}

.empty-state,
.loading-state {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
  color: #5b6168;
  text-align: center;
}

.empty-state strong,
.loading-state strong {
  color: #101214;
  font-size: 20px;
}

.empty-state p,
.loading-state p {
  max-width: 420px;
  margin: 0;
  line-height: 1.7;
}

.loading-spinner {
  width: 34px;
  height: 34px;
  border: 3px solid #dbeafe;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-spinner.small {
  width: 18px;
  height: 18px;
  border-width: 2px;
}

.streaming-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 22px;
  border-top: 1px solid #e5e7eb;
  background: #f8fafc;
}

.streaming-bar p {
  margin: 0;
  color: #5b6168;
  font-size: 13px;
  font-weight: 900;
}

.markdown-message :deep(h1),
.markdown-message :deep(h2),
.markdown-message :deep(h3),
.markdown-message :deep(h4),
.markdown-message :deep(h5),
.markdown-message :deep(h6) {
  margin: 0.95em 0 0.45em;
  color: #101214;
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
  color: #374151;
  line-height: 1.8;
}

.markdown-message :deep(ul),
.markdown-message :deep(ol) {
  padding-left: 1.35em;
}

.markdown-message :deep(code) {
  padding: 2px 5px;
  border-radius: 6px;
  background: #eef2ff;
  color: #1d4ed8;
}

.markdown-message :deep(pre) {
  overflow: auto;
  padding: 14px;
  border-radius: 8px;
  background: #101214;
  color: #ffffff;
}

.markdown-message :deep(pre code) {
  padding: 0;
  background: transparent;
  color: inherit;
}

.markdown-message :deep(blockquote) {
  padding: 10px 14px;
  border-left: 4px solid #2563eb;
  border-radius: 8px;
  background: #f8fafc;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes promptBreath {
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

@media (max-width: 900px) {
  .prompt-page {
    padding: 110px 20px 60px;
  }

  .prompt-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .prompt-heading h1 {
    font-size: 42px;
  }

  .prompt-workbench {
    grid-template-columns: 1fr;
  }

  .prompt-output-panel {
    min-height: 580px;
  }
}

@media (max-width: 560px) {
  .kind-switch,
  .prompt-actions {
    grid-template-columns: 1fr;
  }

  .prompt-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .action-buttons,
  .action-buttons button {
    width: 100%;
  }

  .result-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
