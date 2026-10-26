<script setup>
import { ref } from 'vue'
import { useMockStore } from '../stores/mock'
import { useWalletStore } from '../stores/wallet'
import TxLog from '../components/TxLog.vue'

const store = useMockStore()
const wallet = useWalletStore()

const to = ref('')
const amount = ref('')

const statusText = {
  pending: 'Čeka potvrdu...',
  confirmed: 'Potvrđeno',
  failed: 'Transakcija nije uspjela',
  unknown: 'Status nepoznat, provjeri na Etherscanu',
}

async function send() {
  if (await wallet.sendEth(to.value, amount.value)) {
    to.value = ''
    amount.value = ''
  }
}
</script>

<template>
  <h1>Moj profil</h1>
  <div class="grid">
    <div class="card">
      <div class="muted">Stanje</div>
      <h2 v-if="!wallet.connected">Spoji novčanik</h2>
      <h2 v-else-if="wallet.balance === null">...</h2>
      <h2 v-else>{{ wallet.balance }} ETH</h2>
      <div v-if="wallet.wrongNetwork" class="muted">Stanje je s druge mreže, prebaci na Sepolia.</div>
    </div>
    <div class="card"><div class="muted">Tokeni</div><h2>{{ store.tokens }} RENO</h2></div>
    <div class="card">
      <div class="muted">Provizija za povući</div>
      <h2>{{ store.pendingCommission.toFixed(4) }} ETH</h2>
      <button :disabled="store.pendingCommission <= 0" @click="store.claimCommission()">Povuci proviziju</button>
    </div>
  </div>

  <div class="card" style="margin-top: 1rem">
    <h3>Pošalji ETH</h3>
    <p class="muted">Šalje pravi Sepolia ETH na drugi novčanik. Potvrđuješ u MetaMasku.</p>
    <form @submit.prevent="send">
      <label class="muted" for="to">Adresa primatelja</label>
      <textarea id="to" v-model="to" rows="2" placeholder="0x..." spellcheck="false" style="width: 100%"></textarea>
      <label class="muted" for="amount">Iznos (ETH)</label>
      <input id="amount" v-model="amount" inputmode="decimal" placeholder="0.01" style="width: 100%" />
      <div class="row" style="margin-top: .75rem">
        <button type="submit" :disabled="!wallet.connected || wallet.wrongNetwork || wallet.sending || !to || !amount">
          {{ wallet.sending ? 'Čekam MetaMask...' : 'Pošalji' }}
        </button>
      </div>
    </form>
    <p v-if="wallet.sendError" class="notice" style="margin-top: .75rem">{{ wallet.sendError }}</p>
    <p v-if="wallet.lastTx" style="margin-top: .75rem">
      {{ statusText[wallet.lastTx.status] }}:
      <a :href="'https://sepolia.etherscan.io/tx/' + wallet.lastTx.hash" target="_blank" rel="noopener">{{ wallet.lastTx.hash.slice(0, 10) }}...{{ wallet.lastTx.hash.slice(-8) }}</a>
    </p>
  </div>

  <TxLog />

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
