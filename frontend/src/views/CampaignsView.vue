<script setup>
import CampaignCard from '../components/CampaignCard.vue'
import { useMockStore } from '../stores/mock'

const store = useMockStore()
</script>

<template>
  <h1>Kampanje</h1>
  <p class="muted">Uloži ETH u renovaciju prostorija i primaj udio u prihodu OP-a.</p>
  <div class="grid">
    <CampaignCard v-for="c in store.campaigns" :key="c.id" :campaign="c" />
  </div>
</template>
