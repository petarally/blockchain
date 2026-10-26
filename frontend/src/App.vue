<script setup>
import { onMounted } from 'vue'
import { useMockStore } from './stores/mock'
import { useWalletStore } from './stores/wallet'

const store = useMockStore()
const wallet = useWalletStore()

onMounted(() => wallet.init())
</script>

<template>
  <header class="topbar">
    <div class="container row">
      <router-link to="/" class="logo">RenoFund</router-link>
      <nav class="row">
        <router-link to="/">Kampanje</router-link>
        <router-link to="/profile">Moj profil</router-link>
        <router-link to="/owner">Vlasnik</router-link>
        <a v-if="!wallet.hasMetaMask" href="https://metamask.io/download/" target="_blank" rel="noopener">Instaliraj MetaMask</a>
        <button v-else-if="!wallet.connected" :disabled="wallet.connecting" @click="wallet.connect()">
          {{ wallet.connecting ? 'Spajanje...' : 'Spoji novčanik' }}
        </button>
        <template v-else>
          <button v-if="wallet.wrongNetwork" class="secondary" @click="wallet.switchToSepolia()">Prebaci na Sepolia</button>
          <span class="badge" :class="wallet.wrongNetwork ? 'failed' : 'success'">{{ wallet.shortAddress }}</span>
        </template>
      </nav>
    </div>
  </header>

  <main class="container">
    <div class="notice" style="margin-bottom: 1rem">
      Mockup: novčanik je stvaran (MetaMask), ali kampanje i tokeni su lažni i nisu na blockchainu.
    </div>
    <div v-if="wallet.error" class="notice" style="margin-bottom: 1rem">{{ wallet.error }}</div>
    <router-view />
  </main>

  <div v-if="store.toast" class="toast">{{ store.toast }}</div>
</template>

<style scoped>
.topbar { background: var(--card); border-bottom: 1px solid var(--border); }
.topbar .container { padding-top: .8rem; padding-bottom: .8rem; }
.logo { font-weight: 700; font-size: 1.25rem; }
nav { gap: 1.25rem; }
</style>
