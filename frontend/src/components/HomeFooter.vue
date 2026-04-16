<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue'
import SiteFooter from './SiteFooter.vue'
import ScrollReveal from './ScrollReveal.vue'

defineProps<{
  isEnteringAuth: boolean
}>()

const emit = defineEmits<{
  (e: 'openAuth', mode: 'login' | 'register'): void
}>()

const footerRef = useTemplateRef<HTMLElement>('footerRef')
const isFooterInView = ref(false)

onMounted(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      isFooterInView.value = entry.isIntersecting
    },
    { threshold: 0.1 }
  )

  const el = document.querySelector('.site-footer')
  if (el) observer.observe(el)
})
</script>

<template>
  <div class="home-footer-container">
    <!-- 浮动底部栏 -->
    <div 
      class="floating-bottom-bar" 
      :class="{ 'bar-hiding': isEnteringAuth || isFooterInView }"
    >
      <div class="bar-content">
        <div class="bar-info">
          <span class="bar-tag">NEW</span>
          <span class="bar-text">加入创智工坊，把想法做成作品</span>
        </div>
        <div class="bar-actions">
          <button class="bar-btn-secondary" @click="emit('openAuth', 'login')">登录</button>
          <button class="bar-btn-primary" @click="emit('openAuth', 'register')">免费注册</button>
        </div>
      </div>
    </div>

    <!-- 滚动揭示的页脚 -->
    <ScrollReveal>
      <SiteFooter />
    </ScrollReveal>
  </div>
</template>

<style scoped>
.home-footer-container {
  position: relative;
}

.floating-bottom-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: min(90vw, 800px);
  z-index: 10;
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bar-hiding {
  opacity: 0;
  transform: translate(-50%, 40px) scale(0.9);
  pointer-events: none;
}

.bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 22px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.bar-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-tag {
  background: #101214;
  color: #ffffff;
  font-size: 10px;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 4px;
}

.bar-text {
  font-size: 14px;
  font-weight: 700;
  color: #1d1d1f;
}

.bar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-btn-secondary {
  border: 0;
  background: transparent;
  color: #1d1d1f;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 12px;
}

.bar-btn-primary {
  border: 0;
  background: #1d1d1f;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 20px;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.bar-btn-primary:hover {
  background: #000;
  transform: scale(1.02);
}

@media (max-width: 640px) {
  .floating-bottom-bar {
    bottom: 20px;
  }
  .bar-info {
    display: none;
  }
}
</style>
