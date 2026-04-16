<script setup lang="ts">
import { ref, watch } from 'vue'
import DarkVeil from './DarkVeil.vue'
import { AuthRequestError, login, registerUser, type AuthUser } from '@/services/auth'

type AuthMode = 'login' | 'register'

const props = withDefaults(
  defineProps<{
    initialMode?: AuthMode
  }>(),
  {
    initialMode: 'login',
  },
)

const emit = defineEmits<{
  (event: 'back-home'): void
  (event: 'mode-change', mode: AuthMode): void
  (event: 'authenticated', user: AuthUser): void
}>()

const isLogin = ref(props.initialMode === 'login')
const accountName = ref('')
const studentId = ref('')
const realName = ref('')
const password = ref('')
const confirmPassword = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const formError = ref('')
const formSuccess = ref('')
const isSubmitting = ref(false)
const passwordPattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$'

const isPasswordStrong = (value: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(value)

const toggleMode = () => {
  isLogin.value = !isLogin.value
  formError.value = ''
  formSuccess.value = ''
  emit('mode-change', isLogin.value ? 'login' : 'register')
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleSubmit = async () => {
  formError.value = ''
  formSuccess.value = ''

  if (isSubmitting.value) {
    return
  }

  if (!isLogin.value) {
    if (!/^\d{11}$/.test(studentId.value)) {
      formError.value = '学号必须为 11 位数字。'
      return
    }

    if (password.value.length < 8) {
      formError.value = '密码至少需要 8 位。'
      return
    }

    if (!isPasswordStrong(password.value)) {
      formError.value = '密码必须同时包含大写字母、小写字母和数字。'
      return
    }

    if (password.value !== confirmPassword.value) {
      formError.value = '两次输入的密码不一致。'
      return
    }
  }

  const payload = isLogin.value
    ? { accountName: accountName.value, password: password.value, rememberMe: rememberMe.value }
    : {
        accountName: accountName.value,
        studentId: studentId.value,
        realName: realName.value,
        password: password.value,
      }

  try {
    isSubmitting.value = true
    const response = isLogin.value
      ? await login(payload as { accountName: string; password: string; rememberMe: boolean })
      : await registerUser(
          payload as { accountName: string; studentId: string; realName: string; password: string },
        )

    formSuccess.value = isLogin.value
      ? `登录成功，欢迎 ${response.result.user.accountName}`
      : `注册成功，欢迎 ${response.result.user.accountName}`
    password.value = ''
    confirmPassword.value = ''
    emit('authenticated', response.result.user)
  } catch (error) {
    formError.value =
      error instanceof AuthRequestError ? error.message : '请求失败，请稍后重试。'
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => props.initialMode,
  (mode) => {
    isLogin.value = mode === 'login'
    formError.value = ''
    formSuccess.value = ''
  },
)
</script>

<template>
  <section class="auth-page" aria-labelledby="auth-title">
    <div class="auth-visual" aria-hidden="true">
      <DarkVeil
        :hue-shift="18"
        :noise-intensity="0.04"
        :scanline-intensity="0.08"
        :speed="0.35"
        :scanline-frequency="0"
        :warp-amount="0.5"
        :resolution-scale="1"
      />

      <div class="visual-copy">
        <p class="eyebrow">Creative Workshop</p>
        <h2>把灵感带回工坊</h2>
        <p>登录后继续管理项目、沉淀经验，和团队一起推进下一次验证。</p>
      </div>

      <div class="visual-links">
        <a href="#">隐私政策</a>
        <a href="#">服务条款</a>
      </div>
    </div>

    <div class="auth-panel">
      <button class="back-button" type="button" @click="emit('back-home')">返回首页</button>

      <div class="form-card">
        <transition name="slide" mode="out-in">
          <div :key="isLogin ? 'login' : 'register'" class="form-content">
            <div class="header-section">
              <p class="eyebrow dark">{{ isLogin ? 'Welcome Back' : 'Create Account' }}</p>
              <h1 id="auth-title">{{ isLogin ? '登录创智工坊' : '注册创智工坊' }}</h1>
              <p>{{ isLogin ? '输入账号信息，继续你的工坊进度。' : '创建账号，开始记录项目和成长。' }}</p>
            </div>

            <form class="main-form" @submit.prevent="handleSubmit">
              <div class="input-group">
                <label for="auth-account">账号名</label>
                <input
                  id="auth-account"
                  v-model.trim="accountName"
                  autocomplete="username"
                  type="text"
                  placeholder="请输入账号名"
                  required
                />
              </div>

              <div v-if="!isLogin" class="input-group">
                <label for="auth-student-id">学号</label>
                <input
                  id="auth-student-id"
                  v-model.trim="studentId"
                  autocomplete="off"
                  inputmode="numeric"
                  pattern="\d{11}"
                  maxlength="11"
                  type="text"
                  placeholder="请输入 11 位学号"
                  title="学号必须为 11 位数字"
                  required
                />
              </div>

              <div v-if="!isLogin" class="input-group">
                <label for="auth-real-name">真实姓名</label>
                <input
                  id="auth-real-name"
                  v-model.trim="realName"
                  autocomplete="name"
                  type="text"
                  placeholder="请输入真实姓名"
                  required
                />
              </div>

              <div class="input-group">
                <label for="auth-password">密码</label>
                <div class="password-wrapper">
                  <input
                    id="auth-password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    :autocomplete="isLogin ? 'current-password' : 'new-password'"
                    :pattern="isLogin ? undefined : passwordPattern"
                    placeholder="请输入密码"
                    :title="isLogin ? undefined : '密码必须同时包含大写字母、小写字母和数字'"
                    required
                  />
                  <button
                    class="eye-toggle"
                    type="button"
                    :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                    @click="togglePasswordVisibility"
                  >
                    <svg
                      v-if="!showPassword"
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <svg
                      v-else
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
                      />
                      <path
                        d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
                      />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  </button>
                </div>
              </div>

              <div v-if="!isLogin" class="input-group">
                <label for="auth-confirm-password">确认密码</label>
                <input
                  id="auth-confirm-password"
                  v-model="confirmPassword"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="请再次输入密码"
                  required
                />
              </div>

              <div v-if="isLogin" class="form-options">
                <label class="checkbox-container">
                  <input v-model="rememberMe" type="checkbox" />
                  <span class="checkmark"></span>
                  <span class="label-text">记住我</span>
                </label>
                <a class="forgot-link" href="#">忘记密码?</a>
              </div>

              <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
              <p v-if="formSuccess" class="form-success" role="status">{{ formSuccess }}</p>

              <div class="button-group">
                <button class="btn-submit" type="submit" :disabled="isSubmitting">
                  {{ isSubmitting ? '提交中...' : isLogin ? '登录' : '注册' }}
                </button>
              </div>
            </form>

            <div class="form-footer">
              <p>
                {{ isLogin ? '还没有账号?' : '已有账号?' }}
                <button class="switch-btn" type="button" @click="toggleMode">
                  {{ isLogin ? '立即注册' : '去登录' }}
                </button>
              </p>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </section>
</template>

<style scoped>
.auth-page {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(400px, 3fr);
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  background: #ffffff;
  color: #101214;
}

.auth-visual {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #050808;
  view-transition-name: hero-veil;
}

.visual-copy,
.visual-links {
  position: absolute;
  z-index: 1;
  color: #ffffff;
}

.visual-copy {
  left: clamp(28px, 6vw, 86px);
  bottom: clamp(92px, 13vh, 150px);
  width: min(620px, calc(100% - 56px));
}

.eyebrow {
  margin: 0 0 16px;
  color: #93c5fd;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.eyebrow.dark {
  color: #2563eb;
}

.visual-copy h2 {
  margin: 0;
  font-size: 56px;
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.visual-copy p:last-child {
  width: min(520px, 100%);
  margin: 20px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 18px;
  line-height: 1.8;
}

.visual-links {
  left: clamp(28px, 6vw, 86px);
  bottom: 34px;
  display: flex;
  gap: 24px;
  font-size: 14px;
}

.visual-links a {
  color: rgba(255, 255, 255, 0.66);
}

.auth-panel {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 104px 40px 56px;
  overflow-y: auto;
  scrollbar-gutter: stable;
  background: #f8fafc;
  z-index: 9;
}

.back-button {
  position: absolute;
  top: 40px;
  left: 40px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #101214;
  cursor: pointer;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  z-index: 5;
}

.back-button:hover {
  background: #f8fafc;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.form-card {
  width: min(100%, 420px);
  min-height: 580px;
  position: relative;
  z-index: 1;
  background: #ffffff;
  padding: 40px;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.02);
  view-transition-name: auth-card;
}

.form-content {
  width: 100%;
}

/* 原地切换，避免登录/注册表单横向跑位 */
.slide-enter-active,
.slide-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.header-section {
  margin-bottom: 30px;
}

.header-section h1 {
  margin: 0 0 10px;
  color: #101214;
  font-size: 32px;
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: 0;
}

.header-section p {
  margin: 0;
  color: #64748b;
  font-size: 15px;
  line-height: 1.7;
}

.main-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  color: #1e293b;
  font-size: 14px;
  font-weight: 800;
}

.input-group input {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  color: #101214;
  font-size: 15px;
  padding: 13px 14px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.input-group input:focus {
  outline: none;
  border-color: #101214;
  box-shadow: 0 0 0 4px rgba(16, 18, 20, 0.06);
}

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  padding-right: 48px;
}

.eye-toggle {
  display: inline-flex;
  position: absolute;
  top: 50%;
  right: 12px;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transform: translateY(-50%);
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.checkbox-container {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
}

.checkmark {
  position: relative;
  width: 18px;
  height: 18px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #ffffff;
}

.checkbox-container input:checked + .checkmark {
  border-color: #101214;
  background: #101214;
}

.checkmark::after {
  display: none;
  position: absolute;
  top: 2px;
  left: 6px;
  width: 3px;
  height: 8px;
  border: solid #ffffff;
  border-width: 0 2px 2px 0;
  content: "";
  transform: rotate(45deg);
}

.checkbox-container input:checked + .checkmark::after {
  display: block;
}

.label-text,
.forgot-link {
  font-size: 14px;
}

.label-text {
  color: #64748b;
}

.forgot-link {
  color: #2563eb;
  font-weight: 800;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 6px;
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 900;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.btn-submit {
  border: 0;
  background: #101214;
  color: #ffffff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-submit:hover {
  background: #1e293b;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.btn-submit:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-submit:disabled {
  cursor: wait;
  opacity: 0.68;
  transform: none;
}

.form-error {
  margin: -4px 0 0;
  color: #dc2626;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
}

.form-success {
  margin: -4px 0 0;
  color: #15803d;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
}

.form-footer {
  margin-top: 30px;
  text-align: center;
}

.form-footer p {
  margin: 0;
  color: #64748b;
  font-size: 15px;
}

.switch-btn {
  border: 0;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.switch-btn:hover {
  background: rgba(37, 99, 235, 0.1);
  text-decoration: underline;
  transform: translateY(-1px);
}

.switch-btn:active {
  transform: translateY(0);
}

@media (max-width: 1000px) {
  .auth-page {
    grid-template-columns: 1fr;
  }

  .auth-visual {
    display: none;
  }

  .auth-panel {
    padding: 98px 24px 48px;
    box-shadow: none;
  }

  .form-card {
    min-height: 540px;
  }

  .back-button {
    top: 24px;
    left: 24px;
  }
}

@media (max-width: 520px) {
  .auth-panel {
    align-items: flex-start;
    padding-top: 110px;
  }

  .form-card {
    min-height: auto;
  }

  .header-section h1 {
    font-size: 28px;
  }

  .form-options {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
