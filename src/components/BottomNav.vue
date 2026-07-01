<template>
  <nav class="bottom-nav">
    <template v-if="auth.isMerchantMode">
      <router-link to="/merchant" class="nav-item" active-class="active" exact>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
        <span>Active</span>
      </router-link>
      <router-link to="/merchant/add" class="nav-item" active-class="active">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        <span>Add</span>
      </router-link>
      <router-link to="/merchant/ledger" class="nav-item" active-class="active">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
        <span>Ledger</span>
      </router-link>
      <router-link to="/merchant/scan" class="nav-item" active-class="active">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3M9 9h6v6H9z"></path></svg>
        <span>Scan</span>
      </router-link>
    </template>
    
    <template v-else>
      <router-link to="/customer" class="nav-item" active-class="active" exact>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        <span>Perks</span>
      </router-link>
      <router-link to="/customer/deals" class="nav-item" active-class="active">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        <span>Deals</span>
      </router-link>
      <router-link to="/customer/history" class="nav-item" active-class="active">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        <span>History</span>
      </router-link>
      <router-link to="/customer/scan" class="nav-item" active-class="active">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3M9 9h6v6H9z"></path></svg>
        <span>Scan</span>
      </router-link>
    </template>

    <router-link to="/profile" class="nav-item" active-class="active" custom v-slot="{ navigate }">
      <div @click="navigate" :class="['nav-profile-hex', { 'ring-2 ring-[var(--accent-gold)]': $route.path === '/profile' }]">
        <Identicon :address="auth.address" />
      </div>
    </router-link>
  </nav>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import Identicon from './Identicon.vue';

const auth = useAuthStore();
</script>
