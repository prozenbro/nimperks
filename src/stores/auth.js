import { defineStore } from 'pinia';
import { ref } from 'vue';
import { router } from '@/router';

export const useAuthStore = defineStore('auth', () => {
  const address = ref(null);
  const isMerchantMode = ref(false);

  function login(addr, isMerchant) {
    address.value = addr;
    isMerchantMode.value = isMerchant;
    router.push(isMerchant ? '/merchant' : '/customer');
  }

  function goToProfile() {
    router.push(isMerchantMode.value ? '/merchant/profile' : '/customer/profile');
  }

  function logout() {
    address.value = null;
    isMerchantMode.value = false;
    router.push('/');
  }

  return { address, isMerchantMode, login, logout, goToProfile };
});
