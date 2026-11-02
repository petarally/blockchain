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

## T3 — Specifikacija i recenzija specifikacije (2.11.2026.)

- Cilj termina: Napisati docs/SPEC.md (token RENO + modul Skupljanje sredstava) i kritički je recenzirati
- Recenzija specifikacije: nalazi (brojevi odgovaraju recenziji) i odluke

| Nalaz                                                                                             | Odluka (prihvaćeno / odbijeno)                         | Obrazloženje                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.1 Nije definirano kako ugovor kampanja dobiva pravo izdavanja (mint "samo vlasnik" vs. Matrica) | prihvaćeno                                             | Prava kontradikcija: bez toga claimTokens ne može raditi. Dodani setCampaignContract (jednom, samo vlasnik), K36 i K37.                                                        |
| 1.2 K35 propisuje da uplatitelj ostane bez tokena kad je ETH već isplaćen                         | prihvaćeno                                             | Kvar je ugrađen kao pravilo i protivi se Opisu. Uvedena rezervacija tokena pri uplati; uplata se odbija ako ne stane (K35 prepravljen).                                        |
| 1.3 "Ukupna količina" nije definirana (optjecaj ili ikad izdano)                                  | prihvaćeno                                             | Granica je na stanje u optjecaju; spaljivanje oslobađa mjesto (K38, K39).                                                                                                      |
| 1.4 / 1.5 Granica roka i "cilj dosegnut" nisu definirani                                          | prihvaćeno                                             | Uplata dok je trenutak < rok; povrat, isplata i preuzimanje kad je trenutak >= rok; cilj dosegnut kad je prikupljeno >= cilj (K40–K43).                                        |
| 2.7 / 2.8 Prisilno poslani ETH i ponovni ulaz (reentrancy)                                        | prihvaćeno                                             | Isplate se računaju iz zabilježenih iznosa, a ne iz salda; stanje se mijenja prije slanja ETH-a (K45–K48).                                                                     |
| 3.2 Vlasnik uplaćuje, isplati sebi i preuzme tokene besplatno                                     | prihvaćeno                                             | Jednostavno rješenje bez nove uloge: vlasnik ne smije uplaćivati (K44).                                                                                                        |
| 3.5 renounceOwnership ostavljen otvoren                                                           | prihvaćeno                                             | Jedan poziv trajno gasi izdavanje i zaključava ETH; onemogućeno (K49).                                                                                                         |
| 3.1 Vlasnik može izdati sebi svih 1 000 000 REN bez uplate                                        | odbijeno (kao ograničenje izdavanja); rizik zabilježen | "Izdaje samo vlasnik" je moja svjesna odluka iz razgovora (pitanje 3). Rezervacija ipak štiti tokene već dugovane uplatiteljima. Preostali rizik zapisan u Otvorena pitanja 5. |
| 3.3 Minimalni cilj kampanje (npr. 1 wei)                                                          | odbijeno                                               | Cilj određuje vlasnik, a investitor ga vidi prije uplate. Svaki prag bio bi proizvoljan, a investitor sam procjenjuje je li kampanja smislena.                                 |
| 3.4 Dvostupanjski prijenos vlasništva                                                             | odbijeno                                               | Dodaje novu funkciju i stanje, a nije traženo odlukom o administratorima. Rizik pogrešne adrese zabilježen u Otvorena pitanja 4.                                               |

- Što je AI napravio dobro: pronašao je stvarne kontradikcije (K35, izdavanje preko ugovora kampanja) koje su bile ugrađene u moju specifikaciju
- Što je AI napravio drugačije nego što sam očekivao: nekoliko nalaza traži moju odluku o pravilima, a ne samo dopunu testova
- Što sam dodao u AGENTS.md: ništa
- Provjera: pročitao sam SPEC.md nakon izmjena i provjerio da prihvaćeni nalazi imaju kriterije

| Kriterij              | Što sam napravio                                         | Očekivano                                                      | Dobiveno (poruka iz testa)                                                   |
| --------------------- | -------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| K1                    | Vlasnik izdao 10 000 REN adresi A                        | Stanje A i ukupna količina 10 000                              | Isto                                                                         |
| K2                    | S računa koji nije vlasnik pozvao mint                   | Pada: "Samo vlasnik smije pozvati"                             | Pada: "Samo vlasnik smije pozvati"                                           |
| K3                    | mint 10 001 REN                                          | Pada: "Iznos prelazi 10000 REN po izdavanju"                   | Pada: "Iznos prelazi 10000 REN po izdavanju"                                 |
| K4                    | Ukupna količina 995 000, mint 10 000                     | Pada: "Prekoracena ukupna kolicina od 1000000 REN"             | Pada: "Prekoracena ukupna kolicina od 1000000 REN"                           |
| K5                    | mint s iznosom 0                                         | Pada: "Iznos mora biti veci od nule"                           | Pada: "Iznos mora biti veci od nule"                                         |
| K6                    | A (10 REN) poslao 4 REN adresi B                         | A 6, B 4                                                       | A 6, B 4                                                                     |
| K7                    | A (3 REN) poslao 4 REN                                   | Pada: "Nedovoljno stanja"                                      | Pada: "Nedovoljno stanja"                                                    |
| K8                    | C (odobrenje 2) pozvao transferFrom za 3                 | Pada: "Nedovoljno odobrenje"                                   | Pada: "Nedovoljno odobrenje"                                                 |
| K9                    | A (10 REN) spalio 4                                      | A 6, ukupna količina 6                                         | A 6, ukupna količina 6                                                       |
| K10                   | A (3 REN) spalio 4                                       | Pada: "Nedovoljno tokena za spaljivanje"                       | Pada: "Nedovoljno tokena za spaljivanje"                                     |
| K11                   | transferOwnership na nultu adresu                        | Pada: "Nova adresa nije valjana"                               | Pada: "Nova adresa nije valjana"                                             |
| K37                   | setCampaignContract dvaput                               | Prvi uspijeva, drugi pada: "Ugovor kampanja je vec postavljen" | Isto                                                                         |
| K38                   | Ukupna količina 1 000 000, A spalio 10, vlasnik izdao 10 | Izdavanje uspijeva, ukupna količina 1 000 000                  | Isto (prije spaljivanja mint pada, nakon uspijeva)                           |
| K39                   | Rezervirano 10 000 uz 990 000 u optjecaju, mint 1        | Pada: "Prekoracena ukupna kolicina od 1000000 REN"             | Pada: "Prekoracena ukupna kolicina od 1000000 REN"                           |
| K49                   | renounceOwnership                                        | Pada: "Odricanje nije dopusteno"                               | Pada: "Odricanje nije dopusteno"                                             |
| K50                   | mint na nultu adresu                                     | Pada: "Adresa nije valjana"                                    | Pada: "Adresa nije valjana"                                                  |
| K12–K36, K40–K48, K51 | Nisam pokretao                                           | Ovise o ugovoru kampanja                                       | Nije provjereno: ugovor kampanja još ne postoji (u contracts/ je samo token) |

- Nalazi: nema odstupanja između očekivanog i dobivenog za 17 provjerenih kriterija, pa nije bilo što ispravljati ni u kodu ni u SPEC.md. Kriteriji kampanje ostaju neprovjereni dok se ne napiše ugovor kampanja.
- Što sam dodao u AGENTS.md: ništa
- Commit: 2.11.2026.
