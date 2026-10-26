# AI dnevnik

## T1 — Postavljanje projekta (19.10.2026.)

- Cilj termina: Upoznavanje s AI alatom (Claude)
- Najkorisniji prompt (kopiran u cijelosti): Napravi testni frontend mockup aplikacije
  Pitao me sljedeća pitanja:

1. Smijem li dodati Vue Router, ili ostajem na jednostavnoj navigaciji bez njega?
2. Koji naziv koristim u zaglavlju (npr. Cigla), ili ostaje privremeni?
3. Postoji li već frontend/ (npr. iz predloška), ili ga stvaram od nule?
   Moji odgovori:
4. da. Koristi AGENTS.md kao referencu za stack, ali radimo samo frontend
5. RenoFund
6. od nule

- Što je AI napravio dobro: napravio je mockup frontenda
- Što je AI napravio drugačije nego što sam očekivao: ništa
- Što sam dodao u AGENTS.md: naziv, zajednicu i opis
- Provjera: otvorio sam browser i provjerio kod; nije dodano ništa što nije specificiranou AGENTS.md
- Commit: 19.10.2026.

## T2 — Spajanje walleta s aplikacijom i slanje ETH-a na Sepolia mreži (26.10.2026.)

- Cilj termina: Spojiti aplikaciju s MetaMask walletom na Sepolia mreži, prikazati stvarni balance i omogućiti slanje ETH-a uz log transakcija
- Najkorisniji prompt (kopiran u cijelosti): Trebalo bi sad nadograditi projekt da se može spojiti sa MetaMask walletom.
  Pitao me / predložio sljedeće (prema AGENTS.md prvo plan, tek onda kod):

1. Plan: novi wallet store, bez nove biblioteke (samo window.ethereum), gumb u zaglavlju, mock podaci ostaju
2. Slanje: RENO token još ne postoji na blockchainu pa se ne može stvarno poslati; mogu se stvarno slati samo ETH-i. Želim li to ili lažni prijenos tokena?
3. Log transakcija: MetaMask nema povijest, pa log bilježi samo transakcije poslane iz aplikacije; Etherscan API traži ključ i vanjski servis
   Moji odgovori:
4. Slažem se
5. Ovo 1. sam mislio, da (stvarno slanje ETH-a)
6. Može (log poslanih iz aplikacije)

- Što je AI napravio dobro: spajanje na MetaMask i automatsko prebacivanje na Sepoliju, stvarni balance na profilu, slanje ETH-a preko MetaMaska s validacijom adrese i iznosa (uključujući gas), te log transakcija grupiran po datumu s filterom po statusu
- Što je AI napravio drugačije nego što sam očekivao: prvo spajanje preko window.ethereum nije radilo jer imam instalirano više novčanika; trebalo je prijeći na EIP-6963. Log bilježi samo transakcije poslane nakon njegovog dodavanja, pa starije nisu vidljive
- Što sam dodao u AGENTS.md: ništa
- Provjera: vite build prolazi; u browseru se wallet spojio nakon prelaska na EIP-6963
- Commit: 26.10.2026.
