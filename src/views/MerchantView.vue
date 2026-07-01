<template>
  <!-- 
    MerchantView: owns the full authenticated merchant shell.
    k-page provides the iOS page context so all nested k-navbar etc. behave correctly.
    The k-tabbar sits inside k-page at the bottom.
  -->
  <k-page class="merchant-shell">
    <!-- Scrollable content area, padded by tabbar height -->
    <div class="shell-content">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <!-- iOS-native Tabbar at the bottom -->
    <k-tabbar labels icons slot="fixed">
      <k-tabbar-link
        id="tab-merchant-active"
        :active="$route.path === '/merchant'"
        @click="$router.push('/merchant')"
        label="Campaigns"
      >
        <template #icon>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </template>
      </k-tabbar-link>

      <k-tabbar-link
        id="tab-merchant-add"
        :active="$route.path === '/merchant/add'"
        @click="$router.push('/merchant/add')"
        label="Create"
      >
        <template #icon>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        </template>
      </k-tabbar-link>

      <k-tabbar-link
        id="tab-merchant-scan"
        :active="$route.path === '/merchant/scan'"
        @click="$router.push('/merchant/scan')"
        label="Scan"
      >
        <template #icon>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3M9 9h6v6H9z"/></svg>
        </template>
      </k-tabbar-link>

      <k-tabbar-link
        id="tab-merchant-ledger"
        :active="$route.path === '/merchant/ledger'"
        @click="$router.push('/merchant/ledger')"
        label="Ledger"
      >
        <template #icon>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </template>
      </k-tabbar-link>

      <k-tabbar-link
        id="tab-merchant-profile"
        :active="$route.path === '/merchant/profile'"
        @click="$router.push('/merchant/profile')"
        label="Profile"
      >
        <template #icon>
          <div class="profile-tab-icon" :class="{ 'active': $route.path === '/merchant/profile' }">
            <Identicon :address="auth.address" />
          </div>
        </template>
      </k-tabbar-link>
    </k-tabbar>
  </k-page>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import {
  Page as kPage,
  Tabbar as kTabbar,
  TabbarLink as kTabbarLink
} from 'konsta/vue';
import { useAuthStore } from '@/stores/auth';
import Identicon from '@/components/Identicon.vue';

const auth = useAuthStore();
const $route = useRoute();
const $router = useRouter();
</script>

<style scoped>
.merchant-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary) !important;
}

.shell-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  /* leave room for tabbar (~56px iOS tabbar height) */
  padding-bottom: 56px;
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
}

.profile-tab-icon {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease;
  opacity: 0.8;
}
.profile-tab-icon.active {
  opacity: 1;
  filter: drop-shadow(0 0 6px rgba(233, 178, 19, 0.7));
  transform: scale(1.1);
}

/* Page transition */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.18s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
