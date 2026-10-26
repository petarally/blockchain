import { defineStore } from 'pinia'

const SEPOLIA_CHAIN_ID = '0xaa36a7' // 11155111

const SEPOLIA_PARAMS = {
  chainId: SEPOLIA_CHAIN_ID,
  chainName: 'Sepolia',
  nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
}

const METAMASK_RDNS = 'io.metamask'

// EIP-6963: izabrani provider cuvamo izvan Pinia stanja (nije reaktivan objekt)
let provider = null

// wei -> ETH string, odrezano na 6 decimala
export function formatWei(wei) {
  const base = 10n ** 18n
  return `${wei / base}.${(wei % base).toString().padStart(18, '0').slice(0, 6)}`
}

// log poslanih transakcija cuvamo po adresi racuna; localStorage moze biti nedostupan
const txKey = (address) => `renofund:txs:${address.toLowerCase()}`

function readTxs(address) {
  try {
    const raw = localStorage.getItem(txKey(address))
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch (e) {
    return []
  }
}

function writeTxs(address, txs) {
  try {
    localStorage.setItem(txKey(address), JSON.stringify(txs))
  } catch (e) {
    // log ostaje samo u memoriji
  }
}

const watching = new Set()
let listenersAttached = false

// trazi MetaMask medu novcanicima koji se najave preko EIP-6963;
// ako ga nema, probaj stari window.ethereum (samo ako se predstavlja kao MetaMask)
function discoverProvider(timeout = 500) {
  return new Promise((resolve) => {
    const finish = (p) => {
      window.removeEventListener('eip6963:announceProvider', onAnnounce)
      clearTimeout(timer)
      resolve(p)
    }
    const onAnnounce = (event) => {
      if (event.detail?.info?.rdns === METAMASK_RDNS) finish(event.detail.provider)
    }
    const timer = setTimeout(() => {
      const legacy = window.ethereum
      const mm = legacy?.providers?.find((p) => p.isMetaMask) ?? (legacy?.isMetaMask ? legacy : null)
      finish(mm)
    }, timeout)
    window.addEventListener('eip6963:announceProvider', onAnnounce)
    window.dispatchEvent(new Event('eip6963:requestProvider'))
  })
}

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    address: '',
    chainId: '',
    balance: null, // ETH kao string, null dok nije ocitan
    balanceWei: null, // tocan iznos u wei kao string
    sending: false,
    sendError: '',
    txs: [], // { hash, from, to, value (wei), sentAt, status: 'pending' | 'confirmed' | 'failed' | 'unknown' }
    lastHash: null, // zadnja transakcija poslana u ovoj sesiji
    connecting: false,
    detected: null, // null = jos trazimo, true/false = rezultat
    error: '',
  }),

  getters: {
    hasMetaMask: (s) => s.detected !== false,
    connected: (s) => !!s.address,
    lastTx: (s) => s.txs.find((t) => t.hash === s.lastHash) ?? null,
    wrongNetwork: (s) => !!s.address && s.chainId !== SEPOLIA_CHAIN_ID,
    shortAddress: (s) =>
      s.address ? s.address.slice(0, 6) + '...' + s.address.slice(-4) : '',
  },

  actions: {
    async ensureProvider() {
      if (!provider) provider = await discoverProvider()
      this.detected = !!provider
      return provider
    },

    // tiho vrati vec odobren racun (bez MetaMask prozora) i prati promjene
    async init() {
      if (!(await this.ensureProvider())) return
      this.attachListeners()
      try {
        const accounts = await provider.request({ method: 'eth_accounts' })
        this.address = accounts[0] || ''
        this.chainId = await provider.request({ method: 'eth_chainId' })
        this.loadTxs()
        await this.refreshBalance()
      } catch (e) {
        this.error = 'Ne mogu procitati stanje novcanika'
      }
    },

    async refreshBalance() {
      if (!this.address) {
        this.balance = null
        this.balanceWei = null
        return
      }
      try {
        const hex = await provider.request({
          method: 'eth_getBalance',
          params: [this.address, 'latest'],
        })
        const wei = BigInt(hex)
        const base = 10n ** 18n
        const frac = (wei % base).toString().padStart(18, '0').slice(0, 4)
        this.balance = `${wei / base}.${frac}`
        this.balanceWei = wei.toString()
      } catch (e) {
        this.balance = null
        this.balanceWei = null
        this.error = 'Ne mogu ocitati stanje racuna'
      }
    },

    attachListeners() {
      if (listenersAttached) return
      listenersAttached = true
      provider.on('accountsChanged', (accounts) => {
        this.address = accounts[0] || ''
        this.lastHash = null
        this.loadTxs()
        this.refreshBalance()
      })
      provider.on('chainChanged', (chainId) => {
        this.chainId = chainId
        this.refreshBalance()
      })
    },

    async connect() {
      this.error = ''
      this.connecting = true
      try {
        if (!(await this.ensureProvider())) {
          this.error = 'MetaMask nije pronaden'
          return
        }
        this.attachListeners()
        const accounts = await provider.request({ method: 'eth_requestAccounts' })
        this.address = accounts[0] || ''
        this.chainId = await provider.request({ method: 'eth_chainId' })
        this.loadTxs()
        if (this.wrongNetwork) await this.switchToSepolia()
        await this.refreshBalance()
      } catch (e) {
        console.error('connect nije uspio', e)
        this.error =
          e?.code === 4001 ? 'Spajanje je odbijeno u MetaMasku' : 'Spajanje nije uspjelo'
      } finally {
        this.connecting = false
      }
    },

    // salje pravi (Sepolia) ETH na zadanu adresu preko MetaMaska
    async sendEth(to, amountEth) {
      this.sendError = ''
      to = String(to).trim()
      amountEth = String(amountEth).trim().replace(',', '.')

      if (!this.connected) return this.fail('Prvo spoji novcanik')
      if (this.wrongNetwork) return this.fail('Prebaci se na Sepolia mrezu')
      if (!/^0x[0-9a-fA-F]{40}$/.test(to)) return this.fail('Neispravna adresa primatelja')
      if (to.toLowerCase() === this.address.toLowerCase())
        return this.fail('Ne mozes poslati sam sebi')
      if (!/^\d+(\.\d{1,18})?$/.test(amountEth)) return this.fail('Neispravan iznos')

      const [whole, frac = ''] = amountEth.split('.')
      const wei = BigInt(whole) * 10n ** 18n + BigInt(frac.padEnd(18, '0'))
      if (wei <= 0n) return this.fail('Iznos mora biti veci od 0')

      this.sending = true
      try {
        // iznos + procijenjeni gas ne smiju prelaziti balans
        const balance = BigInt(this.balanceWei ?? 0)
        const gasCost = await this.estimateGasCost(to)
        if (wei + gasCost > balance) {
          const max = balance > gasCost ? balance - gasCost : 0n
          return this.fail(`Nedovoljno sredstava. Maksimalno mozes poslati ${formatWei(max)} ETH (uz gas)`)
        }
        const hash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{ from: this.address, to, value: '0x' + wei.toString(16) }],
        })
        this.addTx({ hash, from: this.address, to, value: wei.toString() })
        return true
      } catch (e) {
        console.error('slanje nije uspjelo', e)
        this.sendError =
          e?.code === 4001 ? 'Transakcija je odbijena u MetaMasku' : 'Slanje nije uspjelo'
      } finally {
        this.sending = false
      }
    },

    // gas * cijena gasa u wei, s 20% rezerve jer se cijena do potvrde moze promijeniti
    async estimateGasCost(to) {
      let gas = 21000n
      try {
        const est = await provider.request({
          method: 'eth_estimateGas',
          params: [{ from: this.address, to, value: '0x0' }],
        })
        gas = BigInt(est)
      } catch (e) {
        // ostaje 21000 (cijena obicnog prijenosa)
      }
      const price = BigInt(await provider.request({ method: 'eth_gasPrice' }))
      return (gas * price * 12n) / 10n
    },

    fail(msg) {
      this.sendError = msg
      return false
    },

    loadTxs() {
      this.txs = this.address ? readTxs(this.address) : []
      // nepotvrdene provjeri ponovno (mozda su u medjuvremenu potvrdene)
      this.txs
        .filter((t) => t.status === 'pending' || t.status === 'unknown')
        .forEach((t) => this.watchTx(t.hash))
    },

    addTx({ hash, from, to, value }) {
      this.txs.unshift({ hash, from, to, value, sentAt: Date.now(), status: 'pending' })
      this.lastHash = hash
      writeTxs(this.address, this.txs)
      this.watchTx(hash)
    },

    setTxStatus(hash, status) {
      const tx = this.txs.find((t) => t.hash === hash)
      if (!tx) return
      tx.status = status
      writeTxs(this.address, this.txs)
    },

    // ceka potvrdu transakcije (do ~2 min), pa osvjezi balans
    async watchTx(hash) {
      if (watching.has(hash)) return
      watching.add(hash)
      try {
        for (let i = 0; i < 60; i++) {
          await new Promise((r) => setTimeout(r, 2000))
          const receipt = await provider.request({
            method: 'eth_getTransactionReceipt',
            params: [hash],
          })
          if (receipt) {
            this.setTxStatus(hash, receipt.status === '0x1' ? 'confirmed' : 'failed')
            await this.refreshBalance()
            return
          }
        }
        this.setTxStatus(hash, 'unknown')
      } catch (e) {
        this.setTxStatus(hash, 'unknown')
      } finally {
        watching.delete(hash)
      }
    },

    async switchToSepolia() {
      this.error = ''
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: SEPOLIA_CHAIN_ID }],
        })
      } catch (e) {
        // 4902: mreza nije dodana u MetaMask
        if (e?.code === 4902) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [SEPOLIA_PARAMS],
            })
          } catch (e2) {
            this.error = 'Dodavanje Sepolia mreze nije uspjelo'
          }
        } else if (e?.code === 4001) {
          this.error = 'Promjena mreze je odbijena'
        } else {
          this.error = 'Promjena mreze nije uspjela'
        }
      }
    },
  },
})
