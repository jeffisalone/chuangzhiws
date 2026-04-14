<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import DarkVeil from './components/DarkVeil.vue'

type Slide = {
  eyebrow: string
  title: string
  text: string
}

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

const currentSlide = computed<Slide>(() => slides[activeSlide.value] ?? slides[0])

let carouselTimer: number | undefined

const selectSlide = (index: number) => {
  activeSlide.value = index
}

onMounted(() => {
  carouselTimer = window.setInterval(() => {
    activeSlide.value = (activeSlide.value + 1) % slides.length
  }, 4200)
})

onBeforeUnmount(() => {
  window.clearInterval(carouselTimer)
})
</script>

<template>
  <div class="site-shell">
    <header class="topbar" aria-label="站点导航">
      <a class="brand" href="#" aria-label="创智工坊首页">
        <img class="brand-logo" src="/logo.svg" alt="" />
        <div style="position: relative;left: -35px;">创智工坊</div>
      </a>

      <nav class="main-nav" aria-label="主导航">
        <a href="#studio">工坊</a>
        <a href="#knowledge">知识库</a>
        <a href="#projects">项目</a>
      </nav>

      <div class="auth-actions" aria-label="账户入口">
        <a class="login-link" href="#">登录</a>
        <a class="register-link" href="#">注册</a>
      </div>
    </header>

    <main>
      <section class="hero" id="studio" aria-labelledby="hero-title">
        <div class="hero-veil" aria-hidden="true">
          <DarkVeil
            :hue-shift="210"
            :noise-intensity="0.02"
            :scanline-intensity="0.1"
            :speed="0.3"
            :scanline-frequency="0.5"
            :warp-amount="0.05"
            :resolution-scale="1"
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

      <section class="feature-band resources-section" id="knowledge" aria-labelledby="knowledge-title">
        <div class="section-heading">
          <p class="eyebrow dark">Resources & Achievement</p>
          <h2 id="knowledge-title">资源与成就</h2>
          <p>探索 AIGC 教程、经验分享、开源项目及成就系统，赋能你的创新旅程。</p>
        </div>

        <div class="resources-grid">
          <article class="resource-card">
            <h3>AIGC教程</h3>
            <p>掌握最新人工智能生成内容技术，利用大模型提高创作与工程效率。</p>
          </article>
          <article class="resource-card">
            <h3>经验分享</h3>
            <p>倾听前人故事，复盘实战经验，少走弯路，在交流中快速成长。</p>
          </article>
          <article class="resource-card">
            <h3>爬虫靶机</h3>
            <p>专业的实战演练环境，提升网络数据抓取、逆向分析与对抗能力。</p>
          </article>
          <article class="resource-card">
            <h3>数据分析案例</h3>
            <p>从海量数据中挖掘核心价值，培养数据敏感度，构建严谨的数据思维。</p>
          </article>
          <article class="resource-card">
            <h3>“烂尾楼”项目重生计划</h3>
            <p>接手真实的未完成项目，在修复与重构中体验代码的起死回生。</p>
          </article>
          <article class="resource-card">
            <h3>“给你了”开源项目库</h3>
            <p>丰富且高度可用的开源代码库，即下即用，加速你的项目启动。</p>
          </article>
          <article class="resource-card achievement-card">
            <h3>成就系统</h3>
            <p>记录你在工坊中的每一次进步，解锁专属荣誉徽章，见证你的成长里程碑。</p>
          </article>
        </div>
      </section>

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
    </main>
  </div>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  min-width: 320px;
  background: #f6f8f7;
  color: #101214;
  font-family:
    Inter, "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
}

:global(html),
:global(body),
:global(#app) {
  max-width: 100%;
  overflow-x: hidden;
}

:global(a) {
  color: inherit;
  text-decoration: none;
}

:global(button) {
  font: inherit;
}

.site-shell {
  min-height: 100vh;
  overflow: hidden;
}

.topbar {
  position: fixed;
  z-index: 10;
  top: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 28px;
  padding: 18px clamp(18px, 5vw, 72px);
  color: #ffffff;
}

.topbar::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  content: "";
  background: linear-gradient(180deg, rgba(5, 8, 8, 0.82), rgba(5, 8, 8, 0.18));
}

.brand,
.auth-actions,
.main-nav {
  display: flex;
  align-items: center;
}

.brand {
  gap: 10px;
  font-size: 17px;
  font-weight: 800;
}

.brand-logo {
  display: block;
  width: 100px;
  height: 50px;
  object-fit: contain;
  filter: invert(1);
}

.main-nav {
  justify-content: center;
  gap: 26px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 14px;
}

.main-nav a:hover,
.login-link:hover {
  color: #ffffff;
}

.auth-actions {
  justify-content: flex-end;
  gap: 10px;
  font-size: 14px;
}

.login-link {
  color: rgba(255, 255, 255, 0.84);
}

.register-link,
.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  border-radius: 8px;
  font-weight: 800;
}

.register-link {
  min-height: 38px;
  padding: 0 16px;
  background: #ffffff;
  color: #101214;
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
}

.hero-veil {
  background: #050808;
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

.resources-section .section-heading {
  margin-bottom: 48px;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.resource-card {
  padding: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(147, 197, 253, 0.1), transparent 40%), #fafafa;
  transition: all 0.3s ease;
  cursor: pointer;
}

.resource-card:hover {
  border-color: #8b5cf6;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(139, 92, 246, 0.12);
  transform: translateY(-4px);
}

.resource-card h3 {
  margin: 0 0 12px;
  color: #1f2937;
  font-size: 24px;
  font-weight: 800;
}

.resource-card p {
  margin: 0;
  color: #6b7280;
  font-size: 16px;
  line-height: 1.6;
}

.achievement-card {
  grid-column: 1 / -1;
  border: 2px dashed #d1d5db;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.05), rgba(147, 197, 253, 0.05));
  text-align: center;
}

.achievement-card:hover {
  border-style: solid;
  border-color: #8b5cf6;
}

.section-heading p:not(.eyebrow) {
  max-width: 680px;
  margin: 20px 0 0;
  color: #5b6168;
  font-size: 19px;
  line-height: 1.7;
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

  .section-heading p:not(.eyebrow) {
    overflow-wrap: anywhere;
    word-break: break-all;
  }
}

@media (max-width: 520px) {
  h1 {
    font-size: 28px;
  }

  h2 {
    font-size: 34px;
  }

  .knowledge-card strong {
    font-size: 32px;
  }
}
</style>
