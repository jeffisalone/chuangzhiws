<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import LoginRegister from './components/LoginRegister.vue'
import ScrollReveal from './components/ScrollReveal.vue'
import HomeFooter from './components/HomeFooter.vue'
import FaultyTerminal from './components/FaultyTerminal.vue'
import DamingbaiWorkbench from './components/DamingbaiWorkbench.vue'
import PromptAssistantWorkbench from './components/PromptAssistantWorkbench.vue'
import FailureManWorkbench from './components/FailureManWorkbench.vue'
import { AuthRequestError, logout, verifySession, type AuthUser } from './services/auth'

type Slide = {
  eyebrow: string
  title: string
  text: string
}

type AuthMode = 'login' | 'register'
type PageView = 'home' | 'dashboard' | 'damingbai' | 'promptAssistant' | 'failureMan'

type UserMenuItem = {
  label: string
  detail: string
  href?: string
  target?: string
  view?: PageView
}

type DashboardModule = {
  title: string
  tag: string
  text: string
  href?: string
  target?: string
  view?: PageView
}

const AIGC_TUTORIAL_URL = 'https://zcnq69e2hdsq.feishu.cn/wiki/Xqe2whcAAi2FrUkYQA0cfUQXnsS'
const CRAWLER_LAB_URL = 'https://wwwadawdwa.rth1.xyz/'

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
const activeView = ref<PageView>('home')
const authMode = ref<AuthMode | null>(null)
const isEnteringAuth = ref(false)
const isReturningHome = ref(false)
const currentUser = ref<AuthUser | null>(null)
const isVerifyingSession = ref(true)
const isUserMenuOpen = ref(false)
const isSigningOut = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const userMenuItems = [
  { label: 'Dashboard', detail: '工作台总览', view: 'dashboard' },
  { label: '大明白', detail: 'AI 问答工作台', view: 'damingbai' },
  { label: '提示词助手', detail: '图片/视频提示词优化', view: 'promptAssistant' },
  { label: 'AIGC教程', detail: '生成式智能课程', href: AIGC_TUTORIAL_URL },
  { label: '失败的Man', detail: '复盘与经验库', view: 'failureMan' },
  { label: '爬虫靶机', detail: '实战训练环境', href: CRAWLER_LAB_URL },
  { label: '数据分析案例', detail: '真实数据练习', target: 'knowledge' },
  { label: '烂尾楼项目', detail: '项目重生计划', target: 'projects' },
  { label: '开源项目库', detail: '可复用代码资产', target: 'projects' },
] satisfies UserMenuItem[]

const featureNavItems = [
  { label: '大明白', detail: 'AI 问答工作台', view: 'damingbai' },
  { label: '提示词助手', detail: '图片/视频提示词优化', view: 'promptAssistant' },
  { label: 'AIGC教程', detail: '生成式智能课程', href: AIGC_TUTORIAL_URL },
  { label: '失败的Man', detail: '复盘与经验库', view: 'failureMan' },
  { label: '爬虫靶机', detail: '实战训练环境', href: CRAWLER_LAB_URL },
  { label: '数据分析', detail: '真实数据练习', target: 'feature-data' },
  { label: '项目重生', detail: '烂尾楼项目计划', target: 'feature-rebuild' },
  { label: '开源库', detail: '可复用代码资产', target: 'feature-opensource' },
] satisfies UserMenuItem[]

const dashboardModules = [
  { title: '大明白', tag: 'AI', text: '连接 SiliconFlow Qwen 模型，用流式输出处理课程、项目和排错问题。', view: 'damingbai' },
  { title: '提示词助手', tag: 'Prompt', text: '使用 stepfun-ai/Step-3.5-Flash 和 CO-STAR 框架，把简单想法改成专业图片或视频提示词。', view: 'promptAssistant' },
  { title: 'AIGC教程', tag: 'Course', text: '从提示词、工作流到工程落地，整理生成式智能学习路径。', href: AIGC_TUTORIAL_URL },
  { title: '失败的Man', tag: 'Review', text: '沉淀试错记录，把失败原因转成下一次可复用的判断。', view: 'failureMan' },
  { title: '爬虫靶机', tag: 'Lab', text: '围绕抓取、逆向、反反爬和数据清洗做实战训练。', href: CRAWLER_LAB_URL },
  { title: '项目重生计划', tag: 'Build', text: '接手未完成项目，在重构、修复和发布中推进作品。', target: 'projects' },
] satisfies DashboardModule[]

const currentSlide = computed<Slide>(() => slides[activeSlide.value] ?? slides[0])
const maxLevel = 60
const currentExperienceInLevel = computed(() => {
  if (!currentUser.value) {
    return 0
  }

  return Math.max(0, currentUser.value.experience - currentUser.value.currentLevelExperience)
})
const requiredExperienceInLevel = computed(() => {
  if (!currentUser.value || currentUser.value.level >= maxLevel) {
    return 0
  }

  return Math.max(1, currentUser.value.nextLevelExperience - currentUser.value.currentLevelExperience)
})
const experienceToNextLevel = computed(() => {
  if (!currentUser.value || currentUser.value.level >= maxLevel) {
    return 0
  }

  return Math.max(0, currentUser.value.nextLevelExperience - currentUser.value.experience)
})
const dashboardStats = computed(() => [
  {
    label: '当前等级',
    value: currentUser.value ? `Lv.${currentUser.value.level}` : 'Lv.1',
    detail: `满级 Lv.${maxLevel}`,
  },
  {
    label: '总经验',
    value: `${currentUser.value?.experience ?? 0}`,
    detail:
      currentUser.value?.level === maxLevel
        ? '已达到满级'
        : `距离升级还需 ${experienceToNextLevel.value} EXP`,
  },
  { label: '会话状态', value: 'Live', detail: '每 60 秒自动验证一次' },
])
const isHomeVisible = computed(
  () => activeView.value === 'home' && (!authMode.value || isEnteringAuth.value || isReturningHome.value),
)
const isAuthHeader = computed(() => Boolean(authMode.value && !isReturningHome.value))

let carouselTimer: number | undefined
let pageTransitionTimer: number | undefined
let sessionVerifyTimer: number | undefined

const selectSlide = (index: number) => {
  activeSlide.value = index
}

const openAuth = (mode: AuthMode) => {
  activeView.value = 'home'
  authMode.value = mode
  window.scrollTo({ top: 0 })
}

const showHome = () => {
  activeView.value = 'home'
  authMode.value = null
  isUserMenuOpen.value = false
  window.scrollTo({ top: 0 })
}

const scrollToSection = (target: string) => {
  showHome()
  window.requestAnimationFrame(() => {
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

const openDashboard = async () => {
  closeUserMenu()
  const user = await verifyCurrentUser()

  if (!user) {
    openAuth('login')
    return
  }

  currentUser.value = user
  activeView.value = 'dashboard'
  authMode.value = null
  window.scrollTo({ top: 0 })
}

const openDamingbai = async () => {
  closeUserMenu()
  const user = await verifyCurrentUser()

  if (!user) {
    openAuth('login')
    return
  }

  currentUser.value = user
  activeView.value = 'damingbai'
  authMode.value = null
  window.scrollTo({ top: 0 })
}

const openPromptAssistant = async () => {
  closeUserMenu()
  const user = await verifyCurrentUser()

  if (!user) {
    openAuth('login')
    return
  }

  currentUser.value = user
  activeView.value = 'promptAssistant'
  authMode.value = null
  window.scrollTo({ top: 0 })
}

const openFailureMan = async () => {
  closeUserMenu()
  const user = await verifyCurrentUser()

  if (!user) {
    openAuth('login')
    return
  }

  currentUser.value = user
  activeView.value = 'failureMan'
  authMode.value = null
  window.scrollTo({ top: 0 })
}

const openExternalFeature = async (href: string) => {
  closeUserMenu()
  const user = await verifyCurrentUser()

  if (!user) {
    openAuth('login')
    return
  }

  window.open(href, '_blank', 'noopener,noreferrer')
}

const handleUserMenuItem = (item: UserMenuItem) => {
  if (item.view === 'dashboard') {
    void openDashboard()
    return
  }

  if (item.view === 'damingbai') {
    void openDamingbai()
    return
  }

  if (item.view === 'promptAssistant') {
    void openPromptAssistant()
    return
  }

  if (item.view === 'failureMan') {
    void openFailureMan()
    return
  }

  if (item.href) {
    void openExternalFeature(item.href)
    return
  }

  if (item.target) {
    scrollToSection(item.target)
  }
}

const handleFeatureNavItem = (item: UserMenuItem) => {
  closeUserMenu()

  if (item.view === 'damingbai') {
    void openDamingbai()
    return
  }

  if (item.view === 'promptAssistant') {
    void openPromptAssistant()
    return
  }

  if (item.view === 'failureMan') {
    void openFailureMan()
    return
  }

  if (item.href) {
    void openExternalFeature(item.href)
    return
  }

  if (item.target) {
    scrollToSection(item.target)
  }
}

const handleDashboardModule = (module: DashboardModule) => {
  if (module.view === 'damingbai') {
    void openDamingbai()
    return
  }

  if (module.view === 'promptAssistant') {
    void openPromptAssistant()
    return
  }

  if (module.view === 'failureMan') {
    void openFailureMan()
    return
  }

  if (module.href) {
    void openExternalFeature(module.href)
    return
  }

  if (module.target) {
    scrollToSection(module.target)
  }
}

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

const verifyCurrentUser = async (): Promise<AuthUser | null> => {
  isVerifyingSession.value = true

  try {
    const response = await verifySession()
    currentUser.value = response.result.user
    return response.result.user
  } catch (error) {
    if (error instanceof AuthRequestError && error.status === 401) {
      currentUser.value = null
      isUserMenuOpen.value = false
      if (activeView.value !== 'home') {
        activeView.value = 'home'
      }
    } else {
      console.warn('Session verification failed', error)
    }

    return null
  } finally {
    isVerifyingSession.value = false
  }
}

const handleAuthenticated = (user: AuthUser) => {
  currentUser.value = user
  showHome()
  void verifyCurrentUser()
}

const handleLogout = async () => {
  if (isSigningOut.value) {
    return
  }

  isSigningOut.value = true

  try {
    await logout()
  } catch (error) {
    console.warn('Logout failed', error)
  } finally {
    currentUser.value = null
    isUserMenuOpen.value = false
    isSigningOut.value = false
    showHome()
  }
}

const handleDocumentClick = (event: MouseEvent) => {
  if (!userMenuRef.value?.contains(event.target as Node)) {
    closeUserMenu()
  }
}

onMounted(() => {
  carouselTimer = window.setInterval(() => {
    activeSlide.value = (activeSlide.value + 1) % slides.length
  }, 4200)
  void verifyCurrentUser()
  sessionVerifyTimer = window.setInterval(() => {
    void verifyCurrentUser()
  }, 60000)
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  window.clearInterval(carouselTimer)
  window.clearInterval(sessionVerifyTimer)
  window.clearTimeout(pageTransitionTimer)
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <div class="site-shell">
    <header v-if="!isAuthHeader" class="topbar" aria-label="站点导航">
      <a class="brand" href="#" aria-label="创智工坊首页" @click.prevent="showHome">
        <img class="brand-logo" src="/logo.svg" alt="" />
        <div v-if="!isAuthHeader" style="position: relative;left: -35px;">创智工坊</div>
      </a>

      <nav v-if="!isAuthHeader" class="main-nav" aria-label="功能导航">
        <button
          v-for="item in featureNavItems"
          :key="item.label"
          type="button"
          @click="handleFeatureNavItem(item)"
        >
          {{ item.label }}
        </button>
      </nav>

      <div v-if="!isAuthHeader" class="auth-actions" aria-label="账户入口">
        <div v-if="currentUser" ref="userMenuRef" class="user-menu">
          <button
            class="session-pill"
            type="button"
            :aria-expanded="isUserMenuOpen"
            aria-haspopup="menu"
            @click.stop="toggleUserMenu"
          >
            <span class="breath-dot" :class="{ checking: isVerifyingSession }"></span>
            <span class="session-name">{{ currentUser.accountName }}</span>
            <span class="session-state">{{ isVerifyingSession ? 'Checking' : 'Verified' }}</span>
            <span class="menu-chevron" :class="{ open: isUserMenuOpen }">⌄</span>
          </button>

          <div v-if="isUserMenuOpen" class="user-dropdown" role="menu">
            <div class="dropdown-header">
              <span class="dropdown-kicker">Signed in</span>
              <strong>{{ currentUser.accountName }}</strong>
            </div>
            <button
              v-for="item in userMenuItems"
              :key="item.label"
              class="dropdown-item"
              type="button"
              role="menuitem"
              @click="handleUserMenuItem(item)"
            >
              <span>{{ item.label }}</span>
              <small>{{ item.detail }}</small>
            </button>
            <div class="dropdown-divider"></div>
            <button
              class="dropdown-item logout-item"
              type="button"
              role="menuitem"
              :disabled="isSigningOut"
              @click="handleLogout"
            >
              <span>{{ isSigningOut ? '退出中...' : '退出登录' }}</span>
              <small>清除当前会话</small>
            </button>
          </div>
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
              <article id="feature-damingbai" class="resource-card damingbai-card" @click="openDamingbai">
                <h3>大明白</h3>
                <p>接入 Qwen 大模型的流式 AI 工作台，随时处理课程、项目、排错和复盘问题。</p>
              </article>
              <article id="feature-prompt" class="resource-card prompt-card" @click="openPromptAssistant">
                <h3>提示词助手</h3>
                <p>接入 stepfun-ai/Step-3.5-Flash，用 CO-STAR 框架把简单想法优化成专业图片或视频提示词。</p>
              </article>
              <article id="feature-aigc" class="resource-card" @click="openExternalFeature(AIGC_TUTORIAL_URL)">
                <h3>AIGC教程</h3>
                <p>掌握最新人工智能生成内容技术，利用大模型提高创作与工程效率。</p>
              </article>
              <article id="feature-failure" class="resource-card" @click="openFailureMan">
                <h3>失败的Man</h3>
                <p>分享失败经验，记录试错复盘，把每一次卡壳变成下一次起步。 (跳转知识库)</p>
              </article>
              <article id="feature-crawler" class="resource-card" @click="openExternalFeature(CRAWLER_LAB_URL)">
                <h3>爬虫靶机</h3>
                <p>专业的实战演练环境，提升网络数据抓取、逆向分析与对抗能力。</p>
              </article>
              <article id="feature-data" class="resource-card" @click="openAuth('login')">
                <h3>数据分析案例</h3>
                <p>从海量数据中挖掘核心价值，培养数据敏感度，构建严谨的数据思维。</p>
              </article>
              <article id="feature-rebuild" class="resource-card" @click="openAuth('login')">
                <h3>“烂尾楼”项目重生计划</h3>
                <p>接手真实的未完成项目，在修复与重构中体验代码的起死回生。</p>
              </article>
              <article id="feature-opensource" class="resource-card" @click="openAuth('login')">
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

      <section
        v-if="activeView === 'dashboard' && currentUser && !authMode"
        class="dashboard-page"
        aria-labelledby="dashboard-title"
      >
        <div class="dashboard-inner">
          <div class="dashboard-heading">
            <p class="eyebrow dark">Dashboard</p>
            <h1 id="dashboard-title">工作台总览</h1>
            <p>
              {{ currentUser.accountName }}，从这里进入课程、复盘、靶机和项目库。
            </p>
          </div>

          <div class="dashboard-status" aria-live="polite">
            <span class="breath-dot" :class="{ checking: isVerifyingSession }"></span>
            <div>
              <strong>{{ isVerifyingSession ? '正在验证登录状态' : '登录状态已验证' }}</strong>
              <span>账号 {{ currentUser.accountName }} · 学号 {{ currentUser.studentId }}</span>
            </div>
            <button type="button" @click="verifyCurrentUser">重新验证</button>
          </div>

          <div class="dashboard-stats" aria-label="工作台指标">
            <article v-for="stat in dashboardStats" :key="stat.label" class="dashboard-stat">
              <span>{{ stat.label }}</span>
              <strong>{{ stat.value }}</strong>
              <p>{{ stat.detail }}</p>
            </article>
          </div>

          <section class="experience-panel" aria-labelledby="experience-title">
            <div class="experience-ring">
              <strong>Lv.{{ currentUser.level }}</strong>
              <span>/ {{ maxLevel }}</span>
            </div>
            <div class="experience-copy">
              <div class="experience-title-row">
                <div>
                  <span class="experience-kicker">Experience</span>
                  <h2 id="experience-title">经验成长</h2>
                </div>
                <strong>{{ currentUser.experience }} EXP</strong>
              </div>
              <div class="experience-bar" role="progressbar" :aria-valuenow="currentUser.levelProgress" aria-valuemin="0" aria-valuemax="100">
                <span :style="{ width: `${currentUser.levelProgress}%` }"></span>
              </div>
              <p v-if="currentUser.level >= maxLevel">
                已达到满级，继续完成模块会记录在成长档案中。
              </p>
              <p v-else>
                本级进度 {{ currentExperienceInLevel }} / {{ requiredExperienceInLevel }} EXP，距离 Lv.{{ currentUser.level + 1 }} 还需 {{ experienceToNextLevel }} EXP。
              </p>
            </div>
          </section>

          <div class="dashboard-section-heading">
            <h2>快捷入口</h2>
            <p>选择一个模块继续推进。</p>
          </div>

          <div class="dashboard-modules">
            <article v-for="module in dashboardModules" :key="module.title" class="dashboard-module">
              <span>{{ module.tag }}</span>
              <h3>{{ module.title }}</h3>
              <p>{{ module.text }}</p>
              <button type="button" @click="handleDashboardModule(module)">进入模块</button>
            </article>
          </div>
        </div>
      </section>

      <DamingbaiWorkbench
        v-if="activeView === 'damingbai' && currentUser && !authMode"
        :user="currentUser"
        :is-verifying-session="isVerifyingSession"
        @verify="verifyCurrentUser"
        @back-dashboard="openDashboard"
      />

      <PromptAssistantWorkbench
        v-if="activeView === 'promptAssistant' && currentUser && !authMode"
        :user="currentUser"
        :is-verifying-session="isVerifyingSession"
        @verify="verifyCurrentUser"
        @back-dashboard="openDashboard"
      />

      <FailureManWorkbench
        v-if="activeView === 'failureMan' && currentUser && !authMode"
        :user="currentUser"
        :is-verifying-session="isVerifyingSession"
        @verify="verifyCurrentUser"
        @back-dashboard="openDashboard"
      />

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

.dashboard-page {
  min-height: 100vh;
  padding: 128px clamp(20px, 7vw, 96px) 86px;
  background:
    linear-gradient(180deg, #f6f8f7 0%, #ffffff 42%),
    #ffffff;
  color: #101214;
}

.dashboard-inner {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.dashboard-heading {
  display: grid;
  gap: 16px;
  max-width: 760px;
}

.dashboard-heading h1 {
  color: #101214;
  font-size: 64px;
  line-height: 1.02;
}

.dashboard-heading p {
  margin: 0;
  color: #5b6168;
  font-size: 20px;
  line-height: 1.7;
}

.dashboard-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 34px;
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #101214;
  color: #ffffff;
}

.dashboard-status > div {
  display: grid;
  flex: 1;
  gap: 4px;
}

.dashboard-status strong {
  font-size: 16px;
}

.dashboard-status span {
  color: rgba(255, 255, 255, 0.68);
  font-size: 13px;
  font-weight: 700;
}

.dashboard-status button,
.dashboard-module button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 8px;
  font-weight: 900;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.dashboard-status button {
  border: 1px solid rgba(255, 255, 255, 0.24);
  color: #ffffff;
}

.dashboard-status button:hover,
.dashboard-module button:hover {
  transform: translateY(-1px);
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 24px;
}

.dashboard-stat,
.dashboard-module {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.dashboard-stat {
  display: grid;
  gap: 8px;
  padding: 24px;
}

.dashboard-stat span,
.dashboard-module span {
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.dashboard-stat strong {
  color: #101214;
  font-size: 36px;
  line-height: 1;
}

.dashboard-stat p,
.dashboard-module p,
.dashboard-section-heading p {
  margin: 0;
  color: #5b6168;
  line-height: 1.7;
}

.experience-panel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 24px;
  margin-top: 24px;
  padding: 26px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.experience-ring {
  display: grid;
  place-items: center;
  align-content: center;
  width: 126px;
  aspect-ratio: 1;
  border: 10px solid #101214;
  border-radius: 50%;
  color: #101214;
}

.experience-ring strong {
  font-size: 26px;
  line-height: 1;
}

.experience-ring span {
  color: #5b6168;
  font-size: 13px;
  font-weight: 900;
}

.experience-copy {
  display: grid;
  align-content: center;
  gap: 14px;
}

.experience-title-row {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
}

.experience-kicker {
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.experience-title-row h2 {
  color: #101214;
  font-size: 34px;
}

.experience-title-row strong {
  color: #101214;
  font-size: 18px;
}

.experience-bar {
  height: 12px;
  overflow: hidden;
  border-radius: 8px;
  background: #e5e7eb;
}

.experience-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #2563eb;
  transition: width 0.35s ease;
}

.experience-copy p {
  margin: 0;
  color: #5b6168;
  line-height: 1.7;
}

.dashboard-section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-top: 54px;
}

.dashboard-section-heading h2 {
  color: #101214;
  font-size: 42px;
}

.dashboard-modules {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 24px;
}

.dashboard-module {
  display: grid;
  gap: 12px;
  padding: 28px;
}

.dashboard-module h3 {
  margin: 0;
  color: #101214;
  font-size: 26px;
}

.dashboard-module button {
  justify-self: start;
  margin-top: 8px;
  background: #101214;
  color: #ffffff;
}

.dashboard-module button:hover {
  background: #1e293b;
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
  flex: 1;
  gap: 8px;
  max-width: min(700px, 54vw);
  margin: 0 20px;
  overflow-x: auto;
  scrollbar-width: none;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-weight: 800;
}

.main-nav::-webkit-scrollbar {
  display: none;
}

.main-nav button {
  flex: 0 0 auto;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  white-space: nowrap;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.main-nav button:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  transform: translateY(-1px);
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

.user-menu {
  position: relative;
  z-index: 5;
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
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.session-pill:hover {
  border-color: rgba(255, 255, 255, 0.52);
  background: rgba(5, 8, 8, 0.48);
  transform: translateY(-1px);
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

.menu-chevron {
  color: rgba(255, 255, 255, 0.72);
  font-size: 16px;
  line-height: 1;
  transition: transform 0.2s ease;
}

.menu-chevron.open {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 280px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(9, 14, 18, 0.94);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(18px);
  animation: dropdownIn 0.18s ease both;
}

.dropdown-header {
  display: grid;
  gap: 4px;
  padding: 12px 12px 10px;
}

.dropdown-kicker {
  color: rgba(255, 255, 255, 0.54);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.dropdown-header strong {
  color: #ffffff;
  font-size: 15px;
  overflow-wrap: anywhere;
}

.dropdown-item {
  display: grid;
  width: 100%;
  min-height: 54px;
  padding: 9px 12px;
  border-radius: 8px;
  color: #ffffff;
  text-align: left;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(2px);
}

.dropdown-item span {
  font-size: 14px;
  font-weight: 900;
}

.dropdown-item small {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-weight: 700;
}

.dropdown-divider {
  height: 1px;
  margin: 8px 6px;
  background: rgba(255, 255, 255, 0.14);
}

.logout-item {
  color: #fecaca;
}

.logout-item small {
  color: rgba(254, 202, 202, 0.72);
}

.logout-item:disabled {
  cursor: wait;
  opacity: 0.66;
  transform: none;
}

@keyframes dropdownIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  scroll-margin-top: 110px;
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

  .dashboard-page {
    padding: 110px 20px 64px;
  }

  .dashboard-heading h1 {
    font-size: 42px;
  }

  .dashboard-status {
    align-items: flex-start;
    flex-direction: column;
  }

  .dashboard-stats,
  .dashboard-modules {
    grid-template-columns: 1fr;
  }

  .experience-panel {
    grid-template-columns: 1fr;
  }

  .experience-ring {
    width: 112px;
  }

  .experience-title-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .dashboard-section-heading {
    align-items: flex-start;
    flex-direction: column;
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
