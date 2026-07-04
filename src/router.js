import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import LoginView from './views/LoginView.vue';

const routes = [
  {
    path: '/',
    component: LoginView
  },
  {
    path: '/customer',
    component: () => import('./views/CustomerView.vue'),
    children: [
      { path: '', component: () => import('./views/customer/CustomerCards.vue') },
      { path: 'deals', component: () => import('./views/customer/CustomerDeals.vue') },
      { path: 'scan', component: () => import('./views/customer/CustomerScan.vue') },
      { path: 'history', component: () => import('./views/customer/CustomerHistory.vue') },
      // Profile accessible from customer shell
      { path: 'profile', component: () => import('./views/ProfileView.vue') },
    ]
  },
  {
    path: '/merchant',
    component: () => import('./views/MerchantView.vue'),
    children: [
      { path: '', component: () => import('./views/merchant/MerchantActive.vue') },
      { path: 'add', component: () => import('./views/merchant/MerchantAdd.vue') },
      { path: 'scan', component: () => import('./views/merchant/MerchantScan.vue') },
      { path: 'ledger', component: () => import('./views/merchant/MerchantLedger.vue') },
      // Profile accessible from merchant shell
      { path: 'profile', component: () => import('./views/ProfileView.vue') },
    ]
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from) => {
  const auth = useAuthStore();
  if (!auth.address && to.path !== '/') {
    return '/';
  }
  return true;
});
