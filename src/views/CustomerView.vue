<template>
  <k-page class="customer-shell">
    <div class="shell-content">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <k-tabbar labels icons slot="fixed">
      <k-tabbar-link
        id="tab-customer-perks"
        :active="$route.path === '/customer'"
        @click="$router.push('/customer')"
        label="Perks"
      >
        <template #icon>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </template>
      </k-tabbar-link>

      <k-tabbar-link
        id="tab-customer-deals"
        :active="$route.path === '/customer/deals'"
        @click="$router.push('/customer/deals')"
        label="Deals"
      >
        <template #icon>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </template>
      </k-tabbar-link>

      <k-tabbar-link
        id="tab-customer-scan"
        :active="$route.path === '/customer/scan'"
        @click="$router.push('/customer/scan')"
        label="Add Store"
      >
        <template #icon>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3M9 9h6v6H9z"/></svg>
        </template>
      </k-tabbar-link>

      <k-tabbar-link
        id="tab-customer-history"
        :active="$route.path === '/customer/history'"
        @click="$router.push('/customer/history')"
        label="History"
      >
        <template #icon>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </template>
      </k-tabbar-link>

      <k-tabbar-link
        id="tab-customer-profile"
        :active="$route.path === '/customer/profile'"
        @click="$router.push('/customer/profile')"
        label="Profile"
      >
        <template #icon>
          <div class="profile-tab-icon" :class="{ 'active': $route.path === '/customer/profile' }">
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
.customer-shell {
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

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.18s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
