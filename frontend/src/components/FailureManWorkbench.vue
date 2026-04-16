<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AuthRequestError, type AuthUser } from '../services/auth'
import {
  createFailureProject,
  listFailureProjects,
  type FailureProject,
} from '../services/failure'

const props = defineProps<{
  user: AuthUser
  isVerifyingSession: boolean
}>()

const emit = defineEmits<{
  verify: []
  backDashboard: []
}>()

const projects = ref<FailureProject[]>([])
const projectName = ref('')
const githubUrl = ref('')
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const levelLabel = computed(() => `Lv.${props.user.level}`)
const canSubmit = computed(
  () => projectName.value.trim().length > 0 && githubUrl.value.trim().length > 0 && !isSubmitting.value,
)

const formatDate = (value: string): string => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const loadProjects = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    projects.value = await listFailureProjects()
  } catch (error) {
    if (error instanceof AuthRequestError && error.status === 401) {
      errorMessage.value = '登录状态已失效，请重新登录后继续使用失败的Man。'
      emit('verify')
    } else {
      errorMessage.value = error instanceof Error ? error.message : '失败项目列表加载失败'
    }
  } finally {
    isLoading.value = false
  }
}

const submitProject = async () => {
  if (!canSubmit.value) {
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const project = await createFailureProject({
      projectName: projectName.value.trim(),
      githubUrl: githubUrl.value.trim(),
    })

    projects.value = [project, ...projects.value.filter((item) => item.id !== project.id)]
    projectName.value = ''
    githubUrl.value = ''
    successMessage.value = '项目已上传'
  } catch (error) {
    if (error instanceof AuthRequestError && error.status === 401) {
      errorMessage.value = '登录状态已失效，请重新登录后继续上传。'
      emit('verify')
    } else {
      errorMessage.value = error instanceof Error ? error.message : '失败项目上传失败'
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  void loadProjects()
})
</script>

<template>
  <section class="failure-page" aria-labelledby="failure-title">
    <div class="failure-inner">
      <header class="failure-heading">
        <div>
          <p class="eyebrow dark">Failure Archive</p>
          <h1 id="failure-title">失败的Man</h1>
          <p>上传失败项目，保留 GitHub 现场，让后来的人少踩一次坑。</p>
        </div>
        <div class="failure-meta" aria-label="当前用户">
          <span :class="{ checking: isVerifyingSession }"></span>
          <strong>{{ user.realName || user.accountName }}</strong>
          <small>{{ levelLabel }} · {{ user.experience }} EXP</small>
        </div>
      </header>

      <div class="failure-actions">
        <button type="button" @click="emit('backDashboard')">返回 Dashboard</button>
        <button type="button" :disabled="isLoading" @click="loadProjects">
          {{ isLoading ? '刷新中' : '刷新列表' }}
        </button>
      </div>

      <div v-if="errorMessage" class="failure-alert error" role="alert">
        {{ errorMessage }}
      </div>
      <div v-else-if="successMessage" class="failure-alert success" role="status">
        {{ successMessage }}
      </div>

      <div v-if="isLoading" class="failure-empty">
        <strong>正在加载失败项目</strong>
        <p>读取大家上传的 GitHub 项目。</p>
      </div>

      <div v-else-if="projects.length" class="failure-list" aria-label="失败项目列表">
        <article v-for="project in projects" :key="project.id" class="failure-project">
          <div>
            <span>{{ project.userName }}</span>
            <h2>{{ project.projectName }}</h2>
            <p>{{ formatDate(project.createdAt) }}</p>
          </div>
          <a :href="project.githubUrl" target="_blank" rel="noreferrer">打开 GitHub</a>
        </article>
      </div>

      <div v-else class="failure-empty">
        <strong>还没有项目</strong>
        <p>把第一个失败项目上传进来。</p>
      </div>
    </div>

    <form class="failure-composer" @submit.prevent="submitProject">
      <label>
        <span>项目名</span>
        <input
          v-model="projectName"
          type="text"
          maxlength="120"
          placeholder="例如：校园二手交易平台"
          :disabled="isSubmitting"
        />
      </label>
      <label>
        <span>GitHub 链接</span>
        <input
          v-model="githubUrl"
          type="url"
          placeholder="https://github.com/user/repo"
          :disabled="isSubmitting"
        />
      </label>
      <button type="submit" :disabled="!canSubmit">
        {{ isSubmitting ? '上传中' : '提交' }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.failure-page {
  min-height: 100vh;
  padding: 128px clamp(20px, 7vw, 96px) 156px;
  background: #f6f8f7;
  color: #101214;
}

.failure-inner {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.failure-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 22px;
}

.failure-heading h1 {
  margin: 0;
  color: #101214;
  font-size: 64px;
  line-height: 1.02;
  letter-spacing: 0;
}

.failure-heading p {
  max-width: 720px;
  margin: 12px 0 0;
  color: #5b6168;
  font-size: 20px;
  line-height: 1.7;
}

.failure-meta {
  display: grid;
  min-width: 190px;
  gap: 4px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.failure-meta span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 rgba(34, 197, 94, 0.46);
  animation: failureBreath 1.8s ease-in-out infinite;
}

.failure-meta span.checking {
  background: #2563eb;
  animation-duration: 0.9s;
}

.failure-meta strong {
  color: #101214;
  font-size: 18px;
}

.failure-meta small {
  color: #5b6168;
  font-weight: 800;
}

.failure-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}

.failure-actions button,
.failure-composer button {
  min-height: 42px;
  border-radius: 8px;
  font-weight: 900;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.failure-actions button {
  padding: 0 16px;
  background: #101214;
  color: #ffffff;
}

.failure-actions button + button {
  background: #e5e7eb;
  color: #101214;
}

.failure-actions button:hover:not(:disabled),
.failure-composer button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.failure-actions button:disabled,
.failure-composer button:disabled,
.failure-composer input:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.failure-alert {
  margin-top: 22px;
  padding: 14px 16px;
  border-radius: 8px;
  font-weight: 900;
}

.failure-alert.error {
  background: #fee2e2;
  color: #991b1b;
}

.failure-alert.success {
  background: #dcfce7;
  color: #166534;
}

.failure-list {
  display: grid;
  gap: 14px;
  margin-top: 30px;
}

.failure-project {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 20px;
  padding: 22px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.failure-project span {
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
}

.failure-project h2 {
  margin: 7px 0;
  color: #101214;
  font-size: 28px;
  line-height: 1.15;
  letter-spacing: 0;
}

.failure-project p {
  margin: 0;
  color: #5b6168;
  font-weight: 800;
}

.failure-project a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 8px;
  background: #101214;
  color: #ffffff;
  font-weight: 900;
}

.failure-empty {
  display: grid;
  place-items: center;
  align-content: center;
  min-height: 360px;
  margin-top: 30px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  text-align: center;
}

.failure-empty strong {
  color: #101214;
  font-size: 24px;
}

.failure-empty p {
  margin: 10px 0 0;
  color: #5b6168;
}

.failure-composer {
  position: fixed;
  z-index: 45;
  right: clamp(16px, 4vw, 54px);
  bottom: 18px;
  left: clamp(16px, 4vw, 54px);
  display: grid;
  grid-template-columns: minmax(160px, 0.8fr) minmax(220px, 1.2fr) auto;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(16, 18, 20, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 22px 70px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(18px);
}

.failure-composer label {
  display: grid;
  gap: 6px;
}

.failure-composer span {
  color: #5b6168;
  font-size: 12px;
  font-weight: 900;
}

.failure-composer input {
  min-height: 44px;
  width: 100%;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  background: #ffffff;
  color: #101214;
  font: inherit;
}

.failure-composer input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.failure-composer button {
  align-self: end;
  min-width: 104px;
  padding: 0 18px;
  background: #2563eb;
  color: #ffffff;
}

@keyframes failureBreath {
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
  .failure-page {
    padding: 110px 20px 230px;
  }

  .failure-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .failure-heading h1 {
    font-size: 42px;
  }

  .failure-project {
    grid-template-columns: 1fr;
  }

  .failure-project a {
    width: 100%;
  }

  .failure-composer {
    grid-template-columns: 1fr;
  }

  .failure-composer button {
    width: 100%;
  }
}
</style>
