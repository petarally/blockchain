<script setup>
import { useMockStore } from './stores/mock'

const store = useMockStore()
</script>

<template>
  <header class="topbar">
    <div class="container row">
      <router-link to="/" class="logo">RenoFund</router-link>
      <nav class="row">
        <router-link to="/">Kampanje</router-link>
        <router-link to="/profile">Moj profil</router-link>
        <router-link to="/owner">Vlasnik</router-link>
        <button v-if="!store.connected" @click="store.connect()">Spoji novčanik</button>
        <span v-else class="badge success">{{ store.shortAddress }}</span>
      </nav>
    </div>
  </header>

  <main class="container">
    <div class="notice" style="margin-bottom: 1rem">
      Mockup: svi podaci su lažni i nema veze s blockchainom.
    </div>
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
