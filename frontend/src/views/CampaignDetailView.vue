<script setup>
import { computed, ref } from 'vue'
import ProgressBar from '../components/ProgressBar.vue'
import { useMockStore } from '../stores/mock'

const props = defineProps({ id: String })
const store = useMockStore()
const campaign = computed(() => store.campaignById(props.id))
const amount = ref('')
const phaseLabels = { locked: 'Zaključana', pending: 'Čeka glasanje', released: 'Isplaćena' }
</script>

<template>
  <div v-if="campaign" class="stack">
    <router-link to="/">&larr; Natrag</router-link>
    <div class="card">
      <h1>{{ campaign.title }}</h1>
      <p>{{ campaign.description }}</p>
      <ProgressBar :value="campaign.raised" :max="campaign.goal" />
    </div>

    <div class="card" v-if="campaign.status === 'active'">
      <h3>Uloži</h3>
      <label>Iznos (ETH)</label>
      <input v-model="amount" type="number" min="0" step="0.1" />
      <p class="muted">Dobivaš: {{ store.tokensFor(amount || 0) }} RENO</p>
      <button @click="store.invest(campaign.id, amount)">Uloži ETH</button>
    </div>

    <div class="card" v-if="campaign.status === 'failed' && campaign.myInvestment > 0">
      <h3>Kampanja nije uspjela</h3>
      <p class="muted">Tvoj ulog: {{ campaign.myInvestment }} ETH</p>
      <button @click="store.refund(campaign.id)">Povuci ulog</button>
    </div>

    <div class="card">
      <h3>Faze isplate</h3>
      <div v-for="p in campaign.phases" :key="p.name" class="row phase">
        <span>{{ p.name }} ({{ p.amount }} ETH)</span>
        <span class="row">
          <span class="badge">{{ phaseLabels[p.status] }}</span>
          <button v-if="p.status === 'pending'" class="secondary" @click="p.status = 'released'">
            Glasaj za
          </button>
        </span>
      </div>
    </div>
  </div>
  <p v-else>Kampanja ne postoji.</p>
</template>

<style scoped>
.phase { padding: .5rem 0; border-top: 1px solid var(--border); }
</style>
