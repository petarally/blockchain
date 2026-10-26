<script setup>
import { computed, ref } from 'vue'
import { useWalletStore, formatWei } from '../stores/wallet'

const wallet = useWalletStore()

const filters = [
  { key: 'all', label: 'Sve' },
  { key: 'pending', label: 'Na čekanju' },
  { key: 'confirmed', label: 'Potvrđeno' },
  { key: 'failed', label: 'Neuspjelo' },
]
const filter = ref('all')

const statusLabel = {
  pending: 'Na čekanju',
  confirmed: 'Potvrđeno',
  failed: 'Neuspjelo',
  unknown: 'Nepoznato',
}
const statusClass = { pending: 'active', confirmed: 'success', failed: 'failed', unknown: '' }

const dayKey = (ts) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dayLabel(ts) {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const key = dayKey(ts)
  if (key === dayKey(today)) return 'Danas'
  if (key === dayKey(yesterday)) return 'Jučer'
  return new Date(ts).toLocaleDateString('hr-HR')
}

const short = (v) => v.slice(0, 6) + '...' + v.slice(-4)
const time = (ts) => new Date(ts).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })

// grupe po datumu, unutar grupe najnovije prvo
const groups = computed(() => {
  const list = wallet.txs
    .filter((t) => filter.value === 'all' || t.status === filter.value)
    .sort((a, b) => b.sentAt - a.sentAt)
  const byDay = new Map()
  for (const t of list) {
    const key = dayKey(t.sentAt)
    if (!byDay.has(key)) byDay.set(key, { key, label: dayLabel(t.sentAt), items: [] })
    byDay.get(key).items.push(t)
  }
  return [...byDay.values()].map((g) => ({
    ...g,
    // zbroj samo potvrdjenih transakcija
    total: formatWei(
      g.items.filter((t) => t.status === 'confirmed').reduce((sum, t) => sum + BigInt(t.value), 0n),
    ),
  }))
})
</script>

<template>
  <div class="card" style="margin-top: 1rem">
    <h3>Log transakcija</h3>
    <p class="muted">Transakcije poslane iz ove aplikacije s ovog računa.</p>

    <div v-if="wallet.connected" class="row filters">
      <button
        v-for="f in filters"
        :key="f.key"
        :class="{ secondary: filter !== f.key }"
        @click="filter = f.key"
      >{{ f.label }}</button>
    </div>

    <p v-if="!wallet.connected" class="muted">Spoji novčanik da vidiš log.</p>
    <p v-else-if="!groups.length" class="muted">Nema transakcija.</p>

    <section v-for="g in groups" :key="g.key" class="group">
      <div class="row group-head">
        <strong>{{ g.label }}</strong>
        <span class="muted">Potvrđeno poslano: {{ g.total }} ETH</span>
      </div>
      <div v-for="t in g.items" :key="t.hash" class="row line">
        <div>
          <div>{{ formatWei(BigInt(t.value)) }} ETH → {{ short(t.to) }}</div>
          <div class="muted">
            {{ time(t.sentAt) }} ·
            <a :href="'https://sepolia.etherscan.io/tx/' + t.hash" target="_blank" rel="noopener">{{ t.hash.slice(0, 10) }}...</a>
          </div>
        </div>
        <span class="badge" :class="statusClass[t.status]">{{ statusLabel[t.status] }}</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.filters { gap: .5rem; margin: .75rem 0; flex-wrap: wrap; }
.group { margin-top: 1rem; }
.group-head { justify-content: space-between; padding-bottom: .35rem; }
.line { justify-content: space-between; padding: .5rem 0; border-top: 1px solid var(--border); }
</style>
