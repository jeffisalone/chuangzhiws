<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue'

const containerRef = useTemplateRef<HTMLDivElement>('containerRef')
const isVisible = ref(false)

onMounted(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        isVisible.value = true
        observer.unobserve(entry.target)
      }
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  )

  if (containerRef.value) {
    observer.observe(containerRef.value)
  }
})
</script>

<template>
  <div ref="containerRef" :class="['reveal-wrapper', { 'reveal-visible': isVisible }]">
    <slot />
  </div>
</template>

<style scoped>
.reveal-wrapper {
  opacity: 0;
  transform: translateY(30px);
  transition: all 1.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: transform, opacity;
}

.reveal-visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
