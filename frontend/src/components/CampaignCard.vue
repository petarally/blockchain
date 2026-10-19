<script setup>
import ProgressBar from './ProgressBar.vue'

defineProps({ campaign: Object })
const labels = { active: 'Aktivna', success: 'Uspjela', failed: 'Neuspjela' }
</script>

<template>
  <router-link :to="{ name: 'campaign', params: { id: campaign.id } }" class="card link">
    <div class="row">
      <h3>{{ campaign.title }}</h3>
      <span class="badge" :class="campaign.status">{{ labels[campaign.status] }}</span>
    </div>
    <p class="muted">{{ campaign.description }}</p>
    <ProgressBar :value="campaign.raised" :max="campaign.goal" />
    <div class="muted" v-if="campaign.status === 'active'">Preostalo dana: {{ campaign.daysLeft }}</div>
  </router-link>
</template>

<style scoped>
.link { display: block; color: inherit; }
.link:hover { border-color: var(--primary); }
</style>
