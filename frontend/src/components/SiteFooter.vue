<script setup lang="ts">
const footerSections = [
  {
    title: '探索',
    links: [
      { text: '工坊首页', href: '#' },
      { text: '知识库', href: '#knowledge' },
      { text: '项目展示', href: '#projects' },
      { text: 'AIGC 教程', href: '#' },
      { text: '开源项目库', href: '#' },
    ],
  },
  {
    title: '活动与竞赛',
    links: [
      { text: '近期竞赛', href: '#' },
      { text: '复盘交流', href: '#' },
      { text: '技术分享会', href: '#' },
      { text: '年度回顾', href: '#' },
    ],
  },
  {
    title: '账户',
    links: [
      { text: '管理我的账户', href: '#' },
      { text: '我的项目', href: '#' },
      { text: '收藏夹', href: '#' },
      { text: '个人设置', href: '#' },
    ],
  },
  {
    title: '关于创智工坊',
    links: [
      { text: '工坊简介', href: '#' },
      { text: '导师团队', href: '#' },
      { text: '联系我们', href: '#' },
      { text: '加入我们', href: '#' },
    ],
  },
]
</script>

<template>
  <footer class="site-footer">
    <div class="footer-content">
      <nav class="footer-nav">
        <div v-for="section in footerSections" :key="section.title" class="footer-column">
          <h3 class="footer-column-title">{{ section.title }}</h3>
          <ul class="footer-column-list">
            <li v-for="link in section.links" :key="link.text">
              <a :href="link.href" class="footer-link">{{ link.text }}</a>
            </li>
          </ul>
        </div>
      </nav>
      
      <section class="footer-more">
        更多方式：<a href="#" class="more-link">寻找导师</a> 或 <a href="#" class="more-link">查找就近工坊</a>。
      </section>
      
      <div class="footer-bottom">
        <div class="footer-legal">
          <span class="copyright">Copyright © 2024 创智工坊. 保留所有权利。</span>
          <div class="legal-links">
            <a href="#">隐私政策</a>
            <a href="#">使用条款</a>
            <a href="#">站点地图</a>
          </div>
        </div>
        <div class="footer-locale">
          <a href="#">中国 (简体中文)</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background: #f5f5f7;
  color: #6e6e73;
  padding: 0 clamp(20px, 7vw, 96px);
  font-size: 12px;
  line-height: 1.33337;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Myriad Set Pro", "SF Pro Icons", "Apple Legacy Icons", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
}

.footer-content {
  max-width: 980px;
  margin: 0 auto;
  padding-top: 20px;
  padding-bottom: 24px;
}

.footer-nav {
  display: flex;
  flex-wrap: wrap;
  padding-top: 20px;
  padding-bottom: 20px;
}

.footer-column {
  flex: 1;
  min-width: 150px;
}

.footer-column-title {
  color: #1d1d1f;
  font-size: 12px;
  font-weight: 600;
  margin: 0 0 0.8em;
  letter-spacing: -0.01em;
}

.footer-column-list {
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
}

.footer-link {
  color: #424245;
  display: inline-block;
  padding: 0.3em 0;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: #1d1d1f;
  text-decoration: underline;
}

.footer-more {
  border-bottom: 1px solid #d2d2d7;
  padding-bottom: 8px;
  margin-bottom: 8px;
  color: #6e6e73;
}

.more-link {
  color: #0066cc;
  text-decoration: none;
}

.more-link:hover {
  text-decoration: underline;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 14px;
  color: #6e6e73;
}

.footer-legal {
  display: flex;
  gap: 24px;
}

.legal-links {
  display: flex;
  gap: 14px;
}

.legal-links a {
  border-right: 1px solid #d2d2d7;
  padding-right: 14px;
  transition: color 0.2s ease;
}

.legal-links a:last-child {
  border-right: none;
}

.legal-links a:hover {
  color: #1d1d1f;
}

.footer-locale a {
  transition: color 0.2s ease;
}

.footer-locale a:hover {
  color: #1d1d1f;
}

@media (max-width: 768px) {
  .footer-nav {
    flex-direction: column;
  }
  
  .footer-column {
    border-bottom: 1px solid #d2d2d7;
    margin-bottom: 0;
    padding: 10px 0;
  }
  
  .footer-column-title {
    margin: 0;
    cursor: pointer;
  }
  
  .footer-column-list {
    display: none; /* In a real Apple site, these are accordions */
  }
  
  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .footer-legal {
    flex-direction: column;
    gap: 5px;
  }
}
</style>
