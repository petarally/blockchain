<script setup>
import { useMockStore } from '../stores/mock'

const store = useMockStore()
</script>

<template>
  <h1>Moj profil</h1>
  <div class="grid">
    <div class="card"><div class="muted">Stanje</div><h2>{{ store.ethBalance.toFixed(2) }} ETH</h2></div>
    <div class="card"><div class="muted">Tokeni</div><h2>{{ store.tokens }} RENO</h2></div>
    <div class="card">
      <div class="muted">Provizija za povući</div>
      <h2>{{ store.pendingCommission.toFixed(4) }} ETH</h2>
      <button :disabled="store.pendingCommission <= 0" @click="store.claimCommission()">Povuci proviziju</button>
    </div>
  </div>

  <div class="card" style="margin-top: 1rem">
    <h3>Moji ulozi</h3>
    <div v-for="c in store.campaigns.filter((x) => x.myInvestment > 0)" :key="c.id" class="row line">
      <router-link :to="{ name: 'campaign', params: { id: c.id } }">{{ c.title }}</router-link>
      <span>{{ c.myInvestment }} ETH</span>
    </div>
    <p v-if="!store.campaigns.some((x) => x.myInvestment > 0)" class="muted">Još nema uloga.</p>
  </div>
</template>

<style scoped>
.line { padding: .5rem 0; border-top: 1px solid var(--border); }
</style>
