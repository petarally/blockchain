import { defineStore } from 'pinia'
import { useWalletStore } from './wallet'

const TOKENS_PER_ETH = 1000

export const useMockStore = defineStore('mock', {
  state: () => ({
    ethBalance: 5,
    tokens: 2500,
    totalSupply: 40000,
    revenuePool: 4, // ukupno uplaceno u fond provizije (ETH)
    claimed: 0.1, // koliko je moj racun vec povukao
    toast: '',
    nextId: 4,
    campaigns: [
      {
        id: 1,
        title: 'Soba za goste, prvi kat',
        description: 'Renovacija stare sobe u apartman za najam.',
        goal: 10,
        raised: 10,
        daysLeft: 0,
        status: 'success',
        myInvestment: 2.5,
        phases: [
          { name: 'Rušenje i priprema', amount: 3, status: 'released' },
          { name: 'Instalacije', amount: 4, status: 'released' },
          { name: 'Završni radovi', amount: 3, status: 'pending' },
        ],
      },
      {
        id: 2,
        title: 'Zajednička kuhinja',
        description: 'Nova kuhinja za goste i radionice.',
        goal: 8,
        raised: 3.2,
        daysLeft: 21,
        status: 'active',
        myInvestment: 0,
        phases: [
          { name: 'Namještaj', amount: 4, status: 'locked' },
          { name: 'Aparati', amount: 4, status: 'locked' },
        ],
      },
      {
        id: 3,
        title: 'Podrumski studio',
        description: 'Adaptacija podruma u studio apartman.',
        goal: 12,
        raised: 2,
        daysLeft: 0,
        status: 'failed',
        myInvestment: 0,
        phases: [{ name: 'Sve faze', amount: 12, status: 'locked' }],
      },
    ],
  }),

  getters: {
    // spajanje novcanika je stvarno (wallet store), ostalo je jos mock
    connected: () => useWalletStore().connected,
    // provizija koju moze povuci: udio u fondu minus vec povuceno
    pendingCommission: (s) =>
      Math.max(0, (s.tokens / s.totalSupply) * s.revenuePool - s.claimed),
    campaignById: (s) => (id) => s.campaigns.find((c) => c.id === Number(id)),
  },

  actions: {
    notify(msg) {
      this.toast = msg
      setTimeout(() => (this.toast = ''), 2500)
    },
    tokensFor(eth) {
      return Math.floor(Number(eth) * TOKENS_PER_ETH)
    },
    invest(id, eth) {
      const c = this.campaignById(id)
      eth = Number(eth)
      if (!this.connected) return this.notify('Prvo spoji novčanik')
      if (!(eth > 0) || eth > this.ethBalance) return this.notify('Neispravan iznos')
      this.ethBalance -= eth
      c.raised = Math.round((c.raised + eth) * 1000) / 1000
      c.myInvestment += eth
      this.tokens += this.tokensFor(eth)
      this.totalSupply += this.tokensFor(eth)
      this.notify(`Uloženo ${eth} ETH`)
    },
    refund(id) {
      const c = this.campaignById(id)
      this.ethBalance += c.myInvestment
      this.tokens -= this.tokensFor(c.myInvestment)
      this.totalSupply -= this.tokensFor(c.myInvestment)
      c.myInvestment = 0
      this.notify('Ulog vraćen')
    },
    claimCommission() {
      this.claimed += this.pendingCommission
      this.ethBalance += this.pendingCommission
      this.notify('Provizija povučena')
    },
    createCampaign({ title, description, goal, days }) {
      this.campaigns.unshift({
        id: this.nextId++,
        title,
        description,
        goal: Number(goal),
        raised: 0,
        daysLeft: Number(days),
        status: 'active',
        myInvestment: 0,
        phases: [{ name: 'Faza 1', amount: Number(goal), status: 'locked' }],
      })
      this.notify('Kampanja stvorena')
    },
    depositRevenue(eth) {
      this.revenuePool += Number(eth)
      this.notify(`Uplaćeno ${eth} ETH u fond provizije`)
    },
  },
})
