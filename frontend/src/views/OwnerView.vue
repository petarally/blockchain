<script setup>
import { reactive, ref } from 'vue'
import { useMockStore } from '../stores/mock'

const store = useMockStore()
const form = reactive({ title: '', description: '', goal: '', days: '' })
const revenue = ref('')

function create() {
  store.createCampaign(form)
  Object.assign(form, { title: '', description: '', goal: '', days: '' })
}
</script>

<template>
  <h1>Vlasnik (OP)</h1>
  <div class="stack">
    <div class="card stack">
      <h3>Nova kampanja</h3>
      <div><label>Naziv</label><input v-model="form.title" /></div>
      <div><label>Opis</label><textarea v-model="form.description" rows="2" /></div>
      <div class="row">
        <div style="flex: 1"><label>Cilj (ETH)</label><input v-model="form.goal" type="number" min="0" /></div>
        <div style="flex: 1"><label>Rok (dana)</label><input v-model="form.days" type="number" min="1" /></div>
      </div>
      <button :disabled="!form.title || !form.goal || !form.days" @click="create">Stvori kampanju</button>
    </div>

    <div class="card stack">
      <h3>Uplata prihoda u fond provizije</h3>
      <div class="muted">Trenutno u fondu: {{ store.revenuePool }} ETH</div>
      <div><label>Iznos (ETH)</label><input v-model="revenue" type="number" min="0" step="0.1" /></div>
      <button :disabled="!(revenue > 0)" @click="store.depositRevenue(revenue)">Uplati</button>
    </div>
  </div>
</template>
