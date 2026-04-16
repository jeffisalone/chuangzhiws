<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import LoginRegister from './components/LoginRegister.vue'
import ScrollReveal from './components/ScrollReveal.vue'
import HomeFooter from './components/HomeFooter.vue'
import FaultyTerminal from './components/FaultyTerminal.vue'
import { AuthRequestError, verifySession, type AuthUser } from './services/auth'

type Slide = {
  eyebrow: string
  title: string
  text: string
}

type AuthMode = 'login' | 'register'

const slides = [
  {
    eyebrow: 'Jilin Communications Polytechnic',
    title: '把想法做成能运行的作品',
    text: '创智工坊连接课程、项目和竞赛，让灵感在真实问题里被验证。',
  },
  {
    eyebrow: 'Build with practice',
    title: '从第一次失败开始升级',
    text: '记录试错、复盘方案、沉淀经验，把每一次卡壳变成下一次起步。',
  },
  {
    eyebrow: 'Create together',
    title: '在工坊里找到你的协作节奏',
    text: '面向学生团队、指导教师和校园创新项目，提供清晰的展示入口。',
  },
] satisfies [Slide, ...Slide[]]

const activeSlide = ref(0)
const authMode = ref<AuthMode | null>(null)
const isEnteringAuth = ref(false)
const isReturningHome = ref(false)
const currentUser = ref<AuthUser | null>(null)
const isVerifyingSession = ref(true)

const currentSlide = computed<Slide>(() => slides[activeSlide.value] ?? slides[0])
const isHomeVisible = computed(() => !authMode.value || isEnteringAuth.value || isReturningHome.value)
const isAuthHeader = computed(() => Boolean(authMode.value && !isReturningHome.value))

let carouselTimer: number | undefined
let pageTransitionTimer: number | undefined
let sessionVerifyTimer: number | undefined

const selectSlide = (index: number) => {
  activeSlide.value = index
}

const openAuth = (mode: AuthMode) => {
  authMode.value = mode
  window.scrollTo({ top: 0 })
}

const showHome = () => {
  authMode.value = null
  window.scrollTo({ top: 0 })
}

const verifyCurrentUser = async () => {
  isVerifyingSession.value = true

  try {
    const response = await verifySession()
    currentUser.value = response.result.user
  } catch (error) {
    if (error instanceof AuthRequestError && error.status === 401) {
      currentUser.value = null
    } else {
      console.warn('Session verification failed', error)
    }
  } finally {
    isVerifyingSession.value = false
  }
}

const handleAuthenticated = (user: AuthUser) => {
  currentUser.value = user
  showHome()
  void verifyCurrentUser()
}

onMounted(() => {
  carouselTimer = window.setInterval(() => {
    activeSlide.value = (activeSlide.value + 1) % slides.length
  }, 4200)
  void verifyCurrentUser()
  sessionVerifyTimer = window.setInterval(() => {
    void verifyCurrentUser()
  }, 60000)
})

onBeforeUnmount(() => {
  window.clearInterval(carouselTimer)
  window.clearInterval(sessionVerifyTimer)
  window.clearTimeout(pageTransitionTimer)
})
</script>

<template>
  <div class="site-shell">
    <header v-if="!isAuthHeader" class="topbar" aria-label="站点导航">
      <a class="brand" href="#" aria-label="创智工坊首页" @click.prevent="showHome">
        <img class="brand-logo" src="/logo.svg" alt="" />
        <div v-if="!isAuthHeader" style="position: relative;left: -35px;">创智工坊</div>
      </a>

      <nav v-if="!isAuthHeader" class="main-nav" aria-label="主导航">
        <a href="#studio">工坊</a>
        <a href="#knowledge">知识库</a>
        <a href="#projects">项目</a>
      </nav>

      <div v-if="!isAuthHeader" class="auth-actions" aria-label="账户入口">
        <div v-if="currentUser" class="session-pill" aria-live="polite">
          <span class="breath-dot" :class="{ checking: isVerifyingSession }"></span>
          <span class="session-name">{{ currentUser.accountName }}</span>
          <span class="session-state">{{ isVerifyingSession ? 'Checking' : 'Verified' }}</span>
        </div>
        <button
          v-if="!currentUser"
          class="auth-btn login-link"
          :class="{ active: authMode === 'login' }"
          type="button"
          @click="openAuth('login')"
        >
          登录
        </button>
        <button
          v-if="!currentUser"
          class="auth-btn register-link"
          :class="{ active: authMode === 'register' }"
          type="button"
          @click="openAuth('register')"
        >
          注册
        </button>
        <div v-if="!currentUser" class="auth-indicator" :class="{ 'login-active': authMode === 'login', 'register-active': authMode === 'register' }"></div>
      </div>
    </header>

    <main
      class="page-stage"
      :class="{
        'stage-entering-auth': isEnteringAuth,
        'stage-returning-home': isReturningHome,
      }"
    >
      <div
        v-if="isHomeVisible"
        key="home"
        class="home-page"
        :class="{
          'home-page-leaving': isEnteringAuth,
          'home-page-returning': isReturningHome,
        }"
      >
        <section class="hero" id="studio" aria-labelledby="hero-title">
          <div class="hero-veil" aria-hidden="true">
            <FaultyTerminal
              :scale="1.5"
              :grid-mul="[2, 1]"
              :digit-size="1.2"
              :time-scale="1"
              :pause="false"
              :scanline-intensity="1"
              :glitch-amount="1"
              :flicker-amount="1"
              :noise-amp="1"
              :chromatic-aberration="0"
              :dither="0"
              :curvature="0"
              tint="#626AD5"
              :mouse-react="true"
              :mouse-strength="0.5"
              :page-load-animation="false"
              :brightness="1"
            />
          </div>
          <div class="hero-shade"></div>

          <div class="hero-content">
            <p class="eyebrow">{{ currentSlide.eyebrow }}</p>
            <h1 id="hero-title">{{ currentSlide.title }}</h1>
            <p class="hero-text">{{ currentSlide.text }}</p>

            <div class="hero-actions">
              <a class="primary-button" href="#knowledge">进入知识库</a>
              <a class="secondary-button" href="#projects">查看项目</a>
            </div>

            <div class="slide-controls" aria-label="Banner 轮播标题">
              <button
                v-for="(_, index) in slides"
                :key="index"
                class="slide-dot"
                :class="{ active: activeSlide === index }"
                type="button"
                :aria-label="`切换到第 ${index + 1} 个标题`"
                :aria-pressed="activeSlide === index"
                @click="selectSlide(index)"
              ></button>
            </div>
          </div>
        </section>

        <ScrollReveal>
          <section class="feature-band resources-section" id="knowledge" aria-labelledby="knowledge-title">
            <div class="section-heading">
              <p class="eyebrow dark">Resources & Achievement</p>
              <h2 id="knowledge-title">资源与成就</h2>
              <p>探索 AIGC 教程、经验分享、开源项目及成就系统，赋能你的创新旅程。</p>
            </div>

            <div class="resources-grid">
              <article class="resource-card" @click="openAuth('login')">
                <h3>AIGC教程</h3>
                <p>掌握最新人工智能生成内容技术，利用大模型提高创作与工程效率。</p>
              </article>
              <article class="resource-card" @click="openAuth('login')">
                <h3>失败的Man</h3>
                <p>分享失败经验，记录试错复盘，把每一次卡壳变成下一次起步。 (跳转知识库)</p>
              </article>
              <article class="resource-card" @click="openAuth('login')">
                <h3>爬虫靶机</h3>
                <p>专业的实战演练环境，提升网络数据抓取、逆向分析与对抗能力。</p>
              </article>
              <article class="resource-card" @click="openAuth('login')">
                <h3>数据分析案例</h3>
                <p>从海量数据中挖掘核心价值，培养数据敏感度，构建严谨的数据思维。</p>
              </article>
              <article class="resource-card" @click="openAuth('login')">
                <h3>“烂尾楼”项目重生计划</h3>
                <p>接手真实的未完成项目，在修复与重构中体验代码的起死回生。</p>
              </article>
              <article class="resource-card" @click="openAuth('login')">
                <h3>“给你了”开源项目库</h3>
                <p>丰富且高度可用的开源代码库，即下即用，加速你的项目启动。</p>
              </article>
              <article class="resource-card achievement-card" @click="openAuth('login')">
                <h3>成就系统</h3>
                <p>记录你在工坊中的每一次进步，解锁专属荣誉徽章，见证你的成长里程碑。</p>
              </article>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section class="project-strip" id="projects" aria-labelledby="projects-title">
            <div class="section-heading compact">
              <p class="eyebrow dark">Workshop Flow</p>
              <h2 id="projects-title">从创意到发布</h2>
            </div>

            <div class="steps">
              <article>
                <span>01</span>
                <h3>提出问题</h3>
                <p>聚焦校园、交通、智能制造和数字服务场景。</p>
              </article>
              <article>
                <span>02</span>
                <h3>快速验证</h3>
                <p>用原型、实验和演示材料检验真实可行性。</p>
              </article>
              <article>
                <span>03</span>
                <h3>公开沉淀</h3>
                <p>整理作品、经验和失败原因，让团队持续迭代。</p>
              </article>
            </div>
          </section>
        </ScrollReveal>

        <HomeFooter 
          :is-entering-auth="isEnteringAuth"
          @open-auth="openAuth"
        />
      </div>

      <div
        v-if="authMode"
        class="auth-layer"
        :class="{
          'auth-layer-entering': isEnteringAuth,
          'auth-layer-returning': isReturningHome,
        }"
      >
        <LoginRegister
          :initial-mode="authMode"
          @back-home="showHome"
          @mode-change="authMode = $event"
          @authenticated="handleAuthenticated"
        />
      </div>
    </main>

  </div>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(html) {
  margin: 0;
  padding: 0;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto; /* 仅允许 html 滚动 */
  background: #f6f8f7;
}

:global(body) {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  overflow: visible; /* 禁用 body 独立滚动 */
  background: #f6f8f7;
  color: #101214;
  font-family:
    Inter, "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}

:global(#app) {
  width: 100%;
}

:global(a) {
  color: inherit;
  text-decoration: none;
}

:global(button) {
  font: inherit;
  border: none;
  background: none;
  cursor: pointer;
}

.site-shell {
  position: relative;
  width: 100%;
  min-height: 100vh;
}

.page-stage {
  position: relative;
  width: 100%;
}

.home-page {
  min-height: 100vh;
}

.auth-layer {
  position: fixed;
  inset: 0;
  width: 100%;
  z-index: 18;
}

.stage-entering-auth,
.stage-returning-home {
  min-height: 100vh;
  overflow: hidden;
}

.home-page-leaving {
  pointer-events: none;
  animation: homeLeaveToAuth 860ms cubic-bezier(0.2, 0.84, 0.28, 1) both;
}

.home-page-returning {
  position: relative;
  z-index: 1;
  animation: homeReturnIn 860ms cubic-bezier(0.2, 0.84, 0.28, 1) both;
}

.auth-layer-entering {
  animation: authLayerIn 860ms cubic-bezier(0.2, 0.84, 0.28, 1) both;
}

.auth-layer-returning {
  pointer-events: none;
  animation: authLayerOut 860ms cubic-bezier(0.2, 0.84, 0.28, 1) both;
}

:global(.auth-layer-entering .form-card) {
  /* Let View Transitions handle this */
}

:global(.auth-layer-returning .auth-visual) {
  /* Let View Transitions handle this */
}

:global(.auth-layer-returning .auth-panel) {
  animation: authPanelToHome 860ms ease both;
}

:global(.auth-layer-returning .form-card) {
  animation: authCardToBottomBar 860ms cubic-bezier(0.2, 0.84, 0.28, 1) both;
}

:global(.auth-layer-returning .visual-copy),
:global(.auth-layer-returning .visual-links),
:global(.auth-layer-returning .back-button) {
  animation: authCopyOut 520ms ease both;
}

.home-page-returning .hero-veil {
  transform-origin: top left;
  animation: heroVeilFromAuth 860ms cubic-bezier(0.2, 0.84, 0.28, 1) both;
}

.home-page-returning .hero-content {
  animation: heroContentIn 720ms ease 120ms both;
}

.home-page-returning .resource-card {
  animation: resourcesFromAuthCard 760ms cubic-bezier(0.2, 0.84, 0.28, 1) 150ms both;
}

.home-page-leaving .hero,
.home-page-leaving .resource-card {
  animation: homeContentToAuth 760ms cubic-bezier(0.2, 0.84, 0.28, 1) both;
}

@keyframes authLayerIn {
  from {
    opacity: 0.01;
  }
  to {
    opacity: 1;
  }
}

@keyframes authLayerOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

:global(.auth-layer-entering .auth-panel) {
  animation: authPanelIn 860ms cubic-bezier(0.2, 0.84, 0.28, 1) both;
}

@keyframes authPanelIn {
  from {
    opacity: 0;
    background-color: transparent;
  }
  to {
    opacity: 1;
    background-color: #f8fafc;
  }
}

@keyframes authPanelToHome {
  from {
    background-color: #f8fafc;
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.06);
  }
  to {
    background-color: transparent;
    box-shadow: none;
  }
}

@keyframes authCopyOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}


@keyframes homeReturnIn {
  from {
    opacity: 0.01;
  }
  to {
    opacity: 1;
  }
}

@keyframes homeLeaveToAuth {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes heroVeilFromAuth {
  from {
    transform: scale(0.7, 1.22);
  }
  to {
    transform: scale(1);
  }
}

@keyframes heroContentIn {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes resourcesFromAuthCard {
  from {
    opacity: 0;
    transform: translate(38vw, -34vh) scale(1.16);
  }
  to {
    opacity: 1;
    transform: translate(0) scale(1);
  }
}

@keyframes homeContentToAuth {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(32px) scale(0.96);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-page-leaving,
  .home-page-returning,
  .auth-layer-entering,
  .auth-layer-returning,
  :global(.auth-layer-entering *),
  :global(.auth-layer-returning *),
  .home-page-returning *,
  .home-page-leaving * {
    animation-duration: 0.01ms !important;
    animation-delay: 0s !important;
  }
}

.topbar {
  position: fixed;
  z-index: 40;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px clamp(18px, 5vw, 72px);
  color: #ffffff;
  transition: background-color 0.86s ease;
}

.topbar::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  content: "";
  background: linear-gradient(180deg, rgba(5, 8, 8, 0.72) 0%, rgba(5, 8, 8, 0) 100%);
  pointer-events: none;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 17px;
  font-weight: 800;
  color: inherit;
  text-decoration: none;
}

.brand-logo {
  display: block;
  width: 100px;
  height: 50px;
  object-fit: contain;
  filter: invert(1);
}

.main-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  font-weight: 500;
}

.main-nav a {
  transition: color 0.3s ease;
  color: inherit;
  text-decoration: none;
}

.auth-actions {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  font-size: 14px;
  padding-bottom: 8px;
}

.auth-actions button {
  border: 0;
  cursor: pointer;
  position: relative;
  z-index: 2;
  min-width: 60px;
  text-align: center;
}

.auth-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 800;
  transition: all 0.3s ease;
  width: 80px;
}

.login-link {
  background: transparent;
  color: rgba(255, 255, 255, 0.84);
}

.login-link:hover {
  color: #ffffff;
}

.register-link {
  background: transparent;
  color: rgba(255, 255, 255, 0.84);
}

.register-link:hover {
  color: #ffffff;
}

.auth-indicator {
  position: absolute;
  bottom: 0;
  height: 3px;
  background: #ffffff;
  border-radius: 3px;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 1;
  width: 80px;
}

.auth-indicator.login-active {
  right: 90px;
}

.auth-indicator.register-active {
  right: 0;
}

.session-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 8px 14px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 8px;
  background: rgba(5, 8, 8, 0.32);
  color: #ffffff;
  backdrop-filter: blur(14px);
}

.breath-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 rgba(34, 197, 94, 0.46);
  animation: userBreath 1.8s ease-in-out infinite;
}

.breath-dot.checking {
  background: #93c5fd;
  animation-duration: 0.9s;
}

.session-name {
  max-width: 120px;
  overflow: hidden;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-state {
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
  font-weight: 800;
}

@keyframes userBreath {
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

.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  border-radius: 8px;
  font-weight: 800;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.primary-button {
  background: #ffffff;
  color: #101214;
}

.secondary-button {
  border: 1px solid rgba(255, 255, 255, 0.48);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.hero {
  position: relative;
  display: grid;
  min-height: 82vh;
  padding: 136px clamp(20px, 7vw, 96px) 70px;
  place-items: center;
  overflow: hidden;
  color: #ffffff;
}

.hero-veil,
.hero-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 允许鼠标穿透到底层交互 */
}

.hero-veil {
  background: #050808;
  view-transition-name: hero-veil;
}

.hero-shade {
  background:
    linear-gradient(90deg, rgba(1, 6, 6, 0.88), rgba(1, 6, 6, 0.52), rgba(1, 6, 6, 0.26)),
    linear-gradient(180deg, rgba(1, 6, 6, 0.3), rgba(1, 6, 6, 0.8));
}

.hero-content {
  position: relative;
  width: min(1080px, 100%);
  text-align: center;
}

.eyebrow {
  margin: 0 0 18px;
  color: #93c5fd;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.eyebrow.dark {
  color: #8b5cf6;
}

h1,
h2,
h3,
p {
  overflow-wrap: anywhere;
}

h1,
h2 {
  margin: 0;
  line-height: 1.04;
  letter-spacing: 0;
}

h1 {
  min-height: 1.12em;
  font-size: 74px;
  font-weight: 900;
  overflow-wrap: anywhere;
  word-break: break-all;
}

h2 {
  font-size: 68px;
  font-weight: 900;
}

h3 {
  margin: 12px 0 10px;
  font-size: 22px;
}

.hero-text {
  width: min(720px, 100%);
  min-height: 58px;
  margin: 24px auto 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 20px;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 34px;
}

.primary-button,
.secondary-button {
  padding: 0 22px;
}

.primary-button {
  background: #ffffff;
  color: #101214;
}

.secondary-button {
  border: 1px solid rgba(255, 255, 255, 0.48);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.slide-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 34px;
}

.slide-dot {
  width: 44px;
  height: 4px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.34);
  cursor: pointer;
}

.slide-dot.active {
  background: #93c5fd;
}

.feature-band,
.project-strip {
  padding: 86px clamp(20px, 7vw, 96px);
}

.feature-band {
  display: block;
  background: #ffffff;
}

.section-heading {
  margin-bottom: 64px;
}

.section-heading h2 {
  font-size: 56px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}

.section-heading p:not(.eyebrow) {
  max-width: 600px;
  margin: 0;
  color: #86868b;
  font-size: 21px;
  line-height: 1.381;
  font-weight: 600;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-top: 48px;
}

.resource-card {
  padding: 48px;
  border: 0;
  border-radius: 28px;
  background: #f5f5f7;
  transition: all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

.resource-card:hover {
  background: #ffffff;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.1);
  transform: scale(1.02);
}

.resource-card h3 {
  margin: 0 0 12px;
  color: #1d1d1f;
  font-size: 28px;
  font-weight: 700;
}

.resource-card p {
  margin: 0;
  color: #1d1d1f;
  font-size: 17px;
  line-height: 1.47059;
  font-weight: 400;
  opacity: 0.8;
}

.achievement-card {
  grid-column: 1 / -1;
  background: #f5f5f7;
}

.achievement-card:hover {
  background: #ffffff;
}

.section-heading.compact {
  max-width: 760px;
}

.project-strip {
  background: #f5f3ff;
}

.steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 42px;
}

.steps article {
  min-height: 230px;
  padding: 28px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.steps span {
  color: #8b5cf6;
  font-weight: 900;
}

.steps p {
  margin: 0;
  color: #5b6168;
  line-height: 1.7;
}

/* 页面切换过渡效果 */
.page-stage {
  position: relative;
  min-height: 100vh;
  transition: all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@media (max-width: 820px) {
  .topbar {
    grid-template-columns: 1fr auto;
    gap: 16px;
    padding: 14px 18px;
  }

  .main-nav {
    display: none;
  }

  .brand {
    font-size: 16px;
  }

  .auth-actions {
    gap: 8px;
  }

  .login-link {
    display: none;
  }

  .hero {
    min-height: 78vh;
    padding: 112px 20px 52px;
  }

  h1 {
    font-size: 48px;
  }

  h2 {
    font-size: 48px;
  }

  .resources-grid {
    grid-template-columns: 1fr;
  }

  .achievement-card {
    grid-column: span 1;
  }

  .hero-text {
    min-height: 92px;
    font-size: 17px;
  }

  .hero-actions a {
    width: 100%;
  }

  .feature-band,
  .project-strip {
    padding: 64px 20px;
  }

  .steps {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  h1 {
    font-size: 28px;
  }

  h2 {
    font-size: 34px;
  }
}

.bar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 640px) {
  .bar-info {
    display: none;
  }
}
</style>
