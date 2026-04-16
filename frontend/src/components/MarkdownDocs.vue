<script setup lang="ts">
import { computed, ref } from 'vue'
import { isMarkdownFile, renderMarkdown } from '../services/markdown'
import type { AuthUser } from '../services/auth'

const props = defineProps<{
  user: AuthUser
  isVerifyingSession: boolean
}>()

const emit = defineEmits<{
  verify: []
  backDashboard: []
}>()

const defaultMarkdown = `# 创智工坊 Markdown 文档

## 支持内容

- 标题、段落、粗体、斜体
- 有序列表和无序列表
- 引用、代码块、分割线
- 表格和链接

| 模块 | 状态 |
| --- | --- |
| .md | 已支持 |
| .MD | 已支持 |

> 选择本地 Markdown 文件后，预览会在浏览器中即时渲染。

\`\`\`ts
const format = '.MD'
console.log('Markdown ready', format)
\`\`\`
`

const fileName = ref('示例文档.md')
const markdownSource = ref(defaultMarkdown)
const errorMessage = ref('')

const renderedDocument = computed(() => renderMarkdown(markdownSource.value))
const documentStats = computed(() => {
  const text = markdownSource.value.trim()

  return {
    lines: text ? text.split(/\r?\n/).length : 0,
    characters: text.length,
  }
})

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  if (!isMarkdownFile(file)) {
    errorMessage.value = '请选择 .md、.MD 或 .markdown 文件'
    input.value = ''
    return
  }

  try {
    markdownSource.value = await file.text()
    fileName.value = file.name
    errorMessage.value = ''
  } catch {
    errorMessage.value = '文档读取失败，请重新选择文件'
  }
}

const resetExample = () => {
  fileName.value = '示例文档.md'
  markdownSource.value = defaultMarkdown
  errorMessage.value = ''
}
</script>

<template>
  <section class="docs-page" aria-labelledby="docs-title">
    <div class="docs-inner">
      <header class="docs-heading">
        <div>
          <p class="eyebrow dark">Markdown Docs</p>
          <h1 id="docs-title">MD 文档</h1>
          <p>打开课程、项目说明和复盘文档，直接在工坊里阅读。</p>
        </div>
        <div class="docs-user" aria-label="当前用户">
          <span :class="{ checking: isVerifyingSession }"></span>
          <strong>{{ user.accountName }}</strong>
          <small>{{ isVerifyingSession ? '验证中' : '登录已验证' }}</small>
        </div>
      </header>

      <div class="docs-layout">
        <aside class="docs-sidebar">
          <div class="upload-panel">
            <h2>选择文档</h2>
            <label class="file-picker">
              <span>打开 .MD 文件</span>
              <input
                type="file"
                accept=".md,.MD,.markdown,.MARKDOWN,text/markdown,text/plain"
                @change="handleFileChange"
              />
            </label>
            <p v-if="errorMessage" class="docs-error">{{ errorMessage }}</p>
            <p v-else>文件只在浏览器本地读取，不上传到后端。</p>
          </div>

          <div class="doc-meta">
            <span>当前文档</span>
            <strong>{{ fileName }}</strong>
            <small>{{ documentStats.lines }} 行 · {{ documentStats.characters }} 字符</small>
          </div>

          <button class="plain-action" type="button" @click="resetExample">恢复示例</button>
          <button class="dashboard-action" type="button" @click="emit('backDashboard')">
            返回 Dashboard
          </button>
          <button class="plain-action" type="button" @click="emit('verify')">重新验证登录</button>
        </aside>

        <div class="docs-workspace">
          <div class="editor-panel">
            <div class="panel-bar">
              <span>Markdown</span>
              <strong>{{ fileName }}</strong>
            </div>
            <textarea v-model="markdownSource" spellcheck="false" aria-label="Markdown 文档源码"></textarea>
          </div>

          <article class="preview-panel" aria-label="Markdown 文档预览">
            <div class="panel-bar">
              <span>Preview</span>
              <strong>.MD</strong>
            </div>
            <div class="markdown-preview" v-html="renderedDocument"></div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.docs-page {
  min-height: 100vh;
  padding: 128px clamp(20px, 7vw, 96px) 76px;
  background:
    linear-gradient(180deg, #f6f8f7 0%, #ffffff 48%),
    #ffffff;
  color: #101214;
}

.docs-inner {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.docs-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 22px;
}

.docs-heading h1 {
  margin: 0;
  color: #101214;
  font-size: 64px;
  line-height: 1.02;
  letter-spacing: 0;
}

.docs-heading p {
  margin: 12px 0 0;
  color: #5b6168;
  font-size: 20px;
  line-height: 1.7;
}

.docs-user {
  display: grid;
  min-width: 190px;
  gap: 4px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.docs-user span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 rgba(34, 197, 94, 0.46);
  animation: docsBreath 1.8s ease-in-out infinite;
}

.docs-user span.checking {
  background: #2563eb;
  animation-duration: 0.9s;
}

.docs-user strong {
  color: #101214;
  font-size: 18px;
}

.docs-user small {
  color: #5b6168;
  font-weight: 800;
}

.docs-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 22px;
  margin-top: 34px;
}

.docs-sidebar {
  align-self: start;
  display: grid;
  gap: 14px;
}

.upload-panel,
.doc-meta {
  display: grid;
  gap: 10px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.upload-panel h2 {
  margin: 0;
  color: #101214;
  font-size: 24px;
}

.upload-panel p,
.doc-meta small {
  margin: 0;
  color: #5b6168;
  font-size: 13px;
  line-height: 1.6;
}

.docs-error {
  color: #b91c1c !important;
  font-weight: 800;
}

.file-picker,
.plain-action,
.dashboard-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 8px;
  font-weight: 900;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.file-picker {
  background: #101214;
  color: #ffffff;
}

.file-picker input {
  display: none;
}

.plain-action {
  background: #f3f4f6;
  color: #101214;
}

.dashboard-action {
  background: #2563eb;
  color: #ffffff;
}

.file-picker:hover,
.plain-action:hover,
.dashboard-action:hover {
  transform: translateY(-1px);
}

.doc-meta span {
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.doc-meta strong {
  color: #101214;
  overflow-wrap: anywhere;
}

.docs-workspace {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 18px;
}

.editor-panel,
.preview-panel {
  min-height: 680px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
}

.panel-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 50px;
  padding: 0 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #101214;
  color: #ffffff;
}

.panel-bar span {
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.panel-bar strong {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-panel textarea {
  width: 100%;
  height: calc(100% - 50px);
  min-height: 630px;
  resize: none;
  padding: 18px;
  border: 0;
  outline: none;
  background: #0b0d0f;
  color: #ffffff;
  font: 14px/1.7 Consolas, "SFMono-Regular", monospace;
}

.markdown-preview {
  height: calc(100% - 50px);
  min-height: 630px;
  padding: 28px;
  overflow: auto;
  color: #101214;
  line-height: 1.75;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  margin: 1.1em 0 0.45em;
  color: #101214;
  line-height: 1.18;
  letter-spacing: 0;
}

.markdown-preview :deep(h1) {
  margin-top: 0;
  font-size: 38px;
}

.markdown-preview :deep(h2) {
  font-size: 28px;
}

.markdown-preview :deep(h3) {
  font-size: 22px;
}

.markdown-preview :deep(p),
.markdown-preview :deep(li) {
  color: #374151;
}

.markdown-preview :deep(a) {
  color: #2563eb;
  font-weight: 800;
}

.markdown-preview :deep(code) {
  padding: 2px 5px;
  border-radius: 6px;
  background: #eef2ff;
  color: #1e40af;
}

.markdown-preview :deep(pre) {
  overflow: auto;
  padding: 16px;
  border-radius: 8px;
  background: #101214;
  color: #ffffff;
}

.markdown-preview :deep(pre code) {
  padding: 0;
  background: transparent;
  color: inherit;
}

.markdown-preview :deep(blockquote) {
  margin: 18px 0;
  padding: 12px 16px;
  border-left: 4px solid #2563eb;
  border-radius: 8px;
  background: #f8fafc;
}

.markdown-preview :deep(table) {
  width: 100%;
  margin: 18px 0;
  border-collapse: collapse;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  text-align: left;
}

.markdown-preview :deep(th) {
  background: #f3f4f6;
  color: #101214;
}

.markdown-preview :deep(hr) {
  margin: 26px 0;
  border: 0;
  border-top: 1px solid #e5e7eb;
}

@keyframes docsBreath {
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

@media (max-width: 980px) {
  .docs-page {
    padding: 110px 20px 60px;
  }

  .docs-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .docs-heading h1 {
    font-size: 42px;
  }

  .docs-layout,
  .docs-workspace {
    grid-template-columns: 1fr;
  }

  .editor-panel,
  .preview-panel {
    min-height: 520px;
  }

  .editor-panel textarea,
  .markdown-preview {
    min-height: 470px;
  }
}
</style>
