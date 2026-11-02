# Specifikacija: RenoFund

## Opis

RenoFund je crowdfunding aplikacija za renovaciju prostorija u nekretnini OP-a. Vlasnik (OP) otvara kampanje s ciljem u ETH i rokom. Investitori uplaćuju ETH u kampanje. Ako kampanja uspije, vlasnik isplaćuje prikupljena sredstva, a investitori preuzimaju zajednički token RENO (REN) razmjerno uplati. Ako kampanja propadne, investitori povlače svoje uplate u cijelosti. Aplikacija radi na mreži Sepolia (chainId 11155111).

## Korisnici i uloge

- **Vlasnik (OP):** jedna adresa. Izdaje tokene, otvara kampanje, isplaćuje sredstva uspjelih kampanja, može prenijeti vlasništvo.
- **Investitor / član zajednice:** bilo koja adresa. Uplaćuje u kampanje, povlači uplatu propale kampanje, preuzima tokene uspjele kampanje, prenosi i spaljuje svoje tokene.
- **Ugovor kampanja:** ugovor s pravom izdavanja tokena samo za potrebe preuzimanja tokena uspjelih kampanja.
- Nema administratora.

## Odluke o tokenu

| Odluka | Odluka |
|---|---|
| Naziv, oznaka, decimale | Naziv RENO, oznaka REN, 0 decimala (cjelobrojni token). |
| Izdavanje | Samo vlasnik, najviše 10 000 REN po jednom izdavanju. Iznimka: ugovor kampanja izdaje tokene uplatiteljima pri preuzimanju; to ograničenje od 10 000 REN ne vrijedi za preuzimanje. Vlasnik jednom postavlja adresu ugovora kampanja; do tada nitko ne može preuzeti tokene. |
| Ukupna količina | Gornja granica 1 000 000 REN na stanje u optjecaju (ukupna količina), pa spaljivanje oslobađa mjesto. Razlog: udio u prihodu računa se razmjerno broju tokena, pa neograničeno izdavanje razvodnjava postojeće imatelje. Tokeni koje kampanje već duguju uplatiteljima (rezervirani) ulaze u tu granicu: vlasnik ih ne može izdati drugima. Poznat prihvaćen rizik: vlasnik može sebi izdati sve nerezervirane tokene bez uplate. |
| Prenosivost | Slobodno prenosiv: vrijede transfer i transferFrom (uz approve). |
| Trošenje | Svaki član može spaliti samo vlastite tokene. Vlasnik ne može spaliti tuđe. |
| Administratori | Ne postoje. Samo vlasnik. |
| Gubitak ključa | Vlasnik može prenijeti vlasništvo na drugu adresu dok ima pristup. Ako izgubi ključ, izdavanje i otvaranje kampanja trajno prestaju, a ETH uspjelih, još neisplaćenih kampanja trajno ostaje zaključan u ugovoru (povrat ne radi jer je cilj dosegnut). Uplatitelji i dalje mogu preuzeti tokene. Poznat prihvaćen rizik. Odricanje od vlasništva (renounce) nije dopušteno. |

## Odluke o modulu

Modul: **Skupljanje sredstava (ETH)**.

| Odluka | Odluka |
|---|---|
| Cilj i rok | Cilj u ETH i rok zadaju se pri otvaranju kampanje, a otvara je samo vlasnik. Najduže trajanje 90 dana. Uplate su moguće dok je trenutak manji od roka. Povrat, isplata i preuzimanje tokena moguće su tek kad je trenutak jednak roku ili veći, pa se te radnje nikad ne preklapaju s uplatom. Cilj je dosegnut kad je prikupljeno jednako cilju ili veće. |
| Minimalna uplata | 0,01 ETH po uplati. Uplata mora biti višekratnik od 0,01 ETH. Vlasnik ne smije uplaćivati u kampanje (inače bi besplatno dobio tokene vraćanjem vlastite uplate isplatom). |
| Rezervacija tokena | Svaka uplata rezervira 1 REN po 0,01 ETH iz preostale količine do granice od 1 000 000 REN. Uplata koja ne stane u preostalu količinu odbija se. Rezervacija se smanjuje kad uplatitelj preuzme tokene ili povuče povrat. |
| Cilj nije dosegnut do roka | Kampanja propada. Svaki uplatitelj sam povlači cijelu svoju uplatu. Vlasnik ne može uzeti sredstva. |
| Povlačenje prije roka | Nije moguće. |
| Isplata | Samo vlasnik, na vlastitu adresu, tek kad je cilj dosegnut i rok istekao. Jednom po kampanji, za cijeli prikupljeni iznos (i iznad cilja). Slanje ETH-a kroz call s provjerom uspjeha. |
| Bodovi (tokeni) za uplatu | 1 REN za svakih 0,01 ETH. Tokeni se dobivaju tek kad kampanja uspije; svaki uplatitelj sam ih preuzima. Propala kampanja ne daje tokene. |

## Funkcije

Svaka funkcija ugovora; opis: tko je smije pozvati, ulazni podaci, što radi, kada pada.

### Token RENO

- **mint(to, amount)** — samo vlasnik. Izdaje `amount` REN adresi `to`. Pada: ne pozove vlasnik; `to` je nulta adresa; `amount` je 0; `amount` > 10 000; ukupna količina uvećana za rezervirane tokene bi prešla 1 000 000. Redoslijed provjera: vlasnik, adresa, iznos 0, limit po izdavanju, ukupna granica.
- **setCampaignContract(addr)** — samo vlasnik, jednom. Postavlja ugovor kampanja koji smije izdavati tokene pri preuzimanju. Pada: ne pozove vlasnik; `addr` je nulta adresa; već postavljen.
- **renounceOwnership()** — nitko; uvijek pada (odricanje nije dopušteno).
- **burn(amount)** — bilo koji imatelj. Spaljuje `amount` vlastitih tokena. Pada: `amount` veći od stanja pozivatelja.
- **transfer(to, amount)** — bilo koji imatelj. Pada: nedovoljno stanje.
- **approve(spender, amount)** — bilo koji imatelj.
- **transferFrom(from, to, amount)** — odobreni potrošač. Pada: nedovoljno stanje ili odobrenje.
- **transferOwnership(newOwner)** — samo vlasnik. Pada: ne pozove vlasnik; `newOwner` je nulta adresa.
- **Funkcije čitanja:** `balanceOf(addr)`, `totalSupply()`, `allowance(owner, spender)`, `owner()`, `campaignContract()`, `reservedTokens()`.

### Kampanje

- **createCampaign(goal, durationDays)** — samo vlasnik. `goal` u wei, `durationDays` od 1 do 90. Stvara kampanju s rokom od trenutka otvaranja. Pada: ne pozove vlasnik; cilj 0; trajanje izvan 1–90.
- **contribute(campaignId)** payable — bilo tko osim vlasnika. Bilježi uplatu pozivatelja, povećava prikupljeni iznos i rezervira tokene. Isplate i povrati računaju se iz zabilježenih iznosa, ne iz salda ugovora. Pada: kampanja ne postoji; pozivatelj je vlasnik; rok istekao; uplata < 0,01 ETH; uplata nije višekratnik od 0,01 ETH; uplata ne stane u preostalu količinu tokena. Redoslijed provjera: kampanja, vlasnik, rok, minimum, višekratnik, tokeni.
- **receive / fallback** — izravno slanje ETH-a ugovoru kampanja uvijek pada.
- **refund(campaignId)** — uplatitelj. Vraća cijelu uplatu pozivatelja i smanjuje rezervaciju. Radi tek kad je trenutak jednak roku ili veći, a cilj nije dosegnut. Pada: kampanja ne postoji; rok nije istekao; cilj dosegnut; pozivatelj nema uplate za povrat; slanje ETH-a ne uspije. Stanje se mijenja prije slanja ETH-a.
- **withdrawFunds(campaignId)** — samo vlasnik. Šalje zabilježeni prikupljeni iznos kampanje vlasniku (adresi koja je vlasnik u trenutku poziva). Pada: ne pozove vlasnik; kampanja ne postoji; rok nije istekao; cilj nije dosegnut; već isplaćeno; slanje ETH-a ne uspije. Oznaka isplaćeno postavlja se prije slanja ETH-a.
- **claimTokens(campaignId)** — uplatitelj. Izdaje pozivatelju (ukupna uplata / 0,01 ETH) REN i smanjuje rezervaciju. Jednom po uplatitelju po kampanji. Ne vrijedi limit od 10 000 REN. Pada: kampanja ne postoji; rok nije istekao; cilj nije dosegnut; nema uplate ili je već preuzeto; ugovor kampanja nije ovlašten.
- **Funkcije čitanja:** `campaigns(id)` (cilj, rok, prikupljeno, isplaćeno), `contributions(id, addr)`, `claimed(id, addr)`, `campaignCount()`.

## Matrica ovlasti

| Funkcija | Vlasnik | Investitor | Ugovor kampanja |
|---|---|---|---|
| mint | da | ne | da (samo unutar claimTokens, nakon setCampaignContract) |
| setCampaignContract (jednom) | da | ne | ne |
| renounceOwnership | ne | ne | ne |
| burn (vlastiti) | da | da | — |
| transfer / approve / transferFrom | da | da | — |
| transferOwnership | da | ne | — |
| createCampaign | da | ne | — |
| contribute | ne | da | — |
| refund | da (svoja uplata) | da (svoja uplata) | — |
| withdrawFunds | da | ne | — |
| claimTokens | da (svoja uplata) | da (svoja uplata) | — |

## Model podataka na lancu

- **Token:** stanja po adresi, odobrenja (adresa → potrošač → iznos), ukupna količina, vlasnik, adresa ugovora kampanja (postavlja se jednom), ukupno rezervirani tokeni. Konstante: decimale 0, najviše 1 000 000 REN ukupno, najviše 10 000 REN po izdavanju.
- **Kampanja** (po ID-u): cilj (wei), rok (vrijeme), ukupno prikupljeno (wei), oznaka isplaćeno.
- **Uplate:** kampanja → adresa → uplaćeni iznos (wei); kampanja → adresa → oznaka preuzeto (tokeni).
- **Događaji:** otvaranje kampanje, uplata, povrat, isplata, preuzimanje tokena.

## Što se NE sprema na blockchain

- Osobni podaci investitora (ime, e-pošta, adresa stanovanja).
- Slike, opisi i dokumenti o prostorijama i renovaciji.
- Izračuni za prikaz (postotak ispunjenosti, preostalo vrijeme, popisi za sučelje).

## Kriteriji prihvaćanja

Poruke grešaka pišu se bez dijakritike.

**K1 — Izdavanje tokena (uspjeh)**
Zadano: pozivatelj je vlasnik, a ukupna količina je 0.
Kada: vlasnik izda 10 000 REN adresi A.
Tada: stanje adrese A je 10 000 REN i ukupna količina je 10 000 REN.

**K2 — Izdavanje tokena tuđom adresom**
Zadano: pozivatelj nije vlasnik.
Kada: pozove mint.
Tada: transakcija pada s porukom "Samo vlasnik smije pozvati".

**K3 — Izdavanje iznad limita po izdavanju**
Zadano: pozivatelj je vlasnik.
Kada: pozove mint s 10 001 REN.
Tada: transakcija pada s porukom "Iznos prelazi 10000 REN po izdavanju".

**K4 — Izdavanje iznad ukupne granice**
Zadano: ukupna količina je 995 000 REN.
Kada: vlasnik izda 10 000 REN.
Tada: transakcija pada s porukom "Prekoracena ukupna kolicina od 1000000 REN".

**K5 — Izdavanje nule**
Zadano: pozivatelj je vlasnik.
Kada: pozove mint s iznosom 0.
Tada: transakcija pada s porukom "Iznos mora biti veci od nule".

**K6 — Prijenos tokena (uspjeh)**
Zadano: adresa A ima 10 REN.
Kada: A pošalje 4 REN adresi B.
Tada: A ima 6 REN, B ima 4 REN.

**K7 — Prijenos bez dovoljno tokena**
Zadano: adresa A ima 3 REN.
Kada: A pošalje 4 REN adresi B.
Tada: transakcija pada s porukom "Nedovoljno stanja".

**K8 — transferFrom bez odobrenja**
Zadano: adresa A ima 10 REN, a adresa C ima odobrenje 2 REN od A.
Kada: C pozove transferFrom za 3 REN s adrese A.
Tada: transakcija pada s porukom "Nedovoljno odobrenje".

**K9 — Spaljivanje vlastitih tokena (uspjeh)**
Zadano: adresa A ima 10 REN.
Kada: A spali 4 REN.
Tada: A ima 6 REN i ukupna količina se smanji za 4.

**K10 — Spaljivanje više nego što imatelj ima**
Zadano: adresa A ima 3 REN.
Kada: A spali 4 REN.
Tada: transakcija pada s porukom "Nedovoljno tokena za spaljivanje".

**K11 — Prijenos vlasništva na nultu adresu**
Zadano: pozivatelj je vlasnik.
Kada: pozove transferOwnership s nultom adresom.
Tada: transakcija pada s porukom "Nova adresa nije valjana".

**K12 — Otvaranje kampanje (uspjeh)**
Zadano: pozivatelj je vlasnik.
Kada: otvori kampanju s ciljem 1 ETH i trajanjem 30 dana.
Tada: kampanja postoji s ciljem 1 ETH, rokom 30 dana od otvaranja i prikupljenim iznosom 0.

**K13 — Otvaranje kampanje s neispravnim trajanjem**
Zadano: pozivatelj je vlasnik.
Kada: otvori kampanju s trajanjem 91 dan (ili 0 dana).
Tada: transakcija pada s porukom "Trajanje mora biti izmedu 1 i 90 dana".

**K14 — Otvaranje kampanje s ciljem 0**
Zadano: pozivatelj je vlasnik.
Kada: otvori kampanju s ciljem 0.
Tada: transakcija pada s porukom "Cilj mora biti veci od nule".

**K15 — Otvaranje kampanje tuđom adresom**
Zadano: pozivatelj nije vlasnik.
Kada: pozove createCampaign.
Tada: transakcija pada s porukom "Samo vlasnik smije pozvati".

**K16 — Uplata (uspjeh)**
Zadano: kampanja traje.
Kada: adresa A uplati 0,05 ETH.
Tada: uplata adrese A je 0,05 ETH i prikupljeni iznos kampanje povećan je za 0,05 ETH.

**K17 — Uplata ispod minimuma**
Zadano: kampanja traje.
Kada: A uplati 0,005 ETH.
Tada: transakcija pada s porukom "Uplata je manja od 0.01 ETH".

**K18 — Uplata koja nije višekratnik**
Zadano: kampanja traje.
Kada: A uplati 0,015 ETH.
Tada: transakcija pada s porukom "Uplata mora biti visekratnik 0.01 ETH".

**K19 — Uplata nakon isteka roka**
Zadano: rok kampanje je istekao.
Kada: A uplati 0,01 ETH.
Tada: transakcija pada s porukom "Kampanja je istekla".

**K20 — Uplata u nepostojeću kampanju**
Zadano: kampanja s tim ID-om ne postoji.
Kada: A uplati 0,01 ETH.
Tada: transakcija pada s porukom "Kampanja ne postoji".

**K21 — Povrat nakon propale kampanje (uspjeh)**
Zadano: rok je istekao, cilj nije dosegnut, A je uplatio 0,05 ETH.
Kada: A pozove refund.
Tada: A dobije 0,05 ETH natrag i njegova uplata u kampanji je 0.

**K22 — Povrat prije isteka roka**
Zadano: kampanja traje, A je uplatio 0,05 ETH.
Kada: A pozove refund.
Tada: transakcija pada s porukom "Rok jos nije istekao".

**K23 — Povrat kad je cilj dosegnut**
Zadano: rok je istekao, cilj je dosegnut.
Kada: A pozove refund.
Tada: transakcija pada s porukom "Cilj je dosegnut".

**K24 — Povrat bez uplate ili drugi put**
Zadano: rok je istekao, cilj nije dosegnut, A nema uplate (ili je već povukao).
Kada: A pozove refund.
Tada: transakcija pada s porukom "Nema uplate za povrat".

**K25 — Isplata uspjele kampanje (uspjeh)**
Zadano: rok je istekao, cilj je dosegnut, prikupljeno je 1,2 ETH, isplata još nije izvršena.
Kada: vlasnik pozove withdrawFunds.
Tada: vlasnik prima 1,2 ETH i kampanja je označena kao isplaćena.

**K26 — Isplata prije isteka roka**
Zadano: kampanja traje, cilj je dosegnut.
Kada: vlasnik pozove withdrawFunds.
Tada: transakcija pada s porukom "Rok jos nije istekao".

**K27 — Isplata kad cilj nije dosegnut**
Zadano: rok je istekao, cilj nije dosegnut.
Kada: vlasnik pozove withdrawFunds.
Tada: transakcija pada s porukom "Cilj nije dosegnut".

**K28 — Dvostruka isplata**
Zadano: kampanja je već isplaćena.
Kada: vlasnik ponovno pozove withdrawFunds.
Tada: transakcija pada s porukom "Sredstva su vec isplacena".

**K29 — Isplata tuđom adresom**
Zadano: rok je istekao, cilj je dosegnut.
Kada: pozivatelj koji nije vlasnik pozove withdrawFunds.
Tada: transakcija pada s porukom "Samo vlasnik smije pozvati".

**K30 — Neuspjelo slanje ETH-a pri isplati**
Zadano: rok je istekao, cilj je dosegnut, a adresa vlasnika odbija primitak ETH-a.
Kada: vlasnik pozove withdrawFunds.
Tada: transakcija pada s porukom "Isplata nije uspjela" i kampanja ostaje neisplaćena.

**K31 — Preuzimanje tokena (uspjeh)**
Zadano: rok je istekao, cilj je dosegnut, A je uplatio ukupno 0,25 ETH.
Kada: A pozove claimTokens.
Tada: A prima 25 REN i preuzimanje je za A označeno kao izvršeno.

**K32 — Preuzimanje tokena drugi put**
Zadano: A je već preuzeo tokene za tu kampanju.
Kada: A ponovno pozove claimTokens.
Tada: transakcija pada s porukom "Nema tokena za preuzimanje".

**K33 — Preuzimanje tokena kod propale kampanje**
Zadano: rok je istekao, cilj nije dosegnut.
Kada: A pozove claimTokens.
Tada: transakcija pada s porukom "Cilj nije dosegnut".

**K34 — Preuzimanje tokena prije isteka roka**
Zadano: kampanja traje.
Kada: A pozove claimTokens.
Tada: transakcija pada s porukom "Rok jos nije istekao".

**K35 — Uplata koja ne stane u preostalu količinu tokena**
Zadano: ukupna količina uvećana za rezervirane tokene je 999 990 REN, kampanja traje.
Kada: A uplati 0,25 ETH (25 REN).
Tada: transakcija pada s porukom "Nema dovoljno tokena za kampanju".

**K36 — Preuzimanje tokena bez ovlaštenog ugovora**
Zadano: kampanja je uspjela, ugovor kampanja nije postavljen kao izdavatelj.
Kada: A pozove claimTokens.
Tada: transakcija pada s porukom "Ugovor kampanja nije ovlasten".

**K37 — Postavljanje ugovora kampanja**
Zadano: pozivatelj je vlasnik, a ugovor kampanja nije postavljen.
Kada: postavi adresu ugovora, a zatim pokuša postaviti drugu.
Tada: prvi poziv uspijeva i campaignContract vraća adresu; drugi pada s porukom "Ugovor kampanja je vec postavljen".

**K38 — Spaljivanje oslobađa mjesto do granice**
Zadano: ukupna količina je 1 000 000 REN, nema rezerviranih tokena, A je spalio 10 REN.
Kada: vlasnik izda 10 REN.
Tada: izdavanje uspijeva i ukupna količina je opet 1 000 000 REN.

**K39 — Izdavanje ne smije ući u rezervirane tokene**
Zadano: ukupna količina je 990 000 REN, rezervirano je 10 000 REN.
Kada: vlasnik izda 1 REN.
Tada: transakcija pada s porukom "Prekoracena ukupna kolicina od 1000000 REN".

**K40 — Uplata u trenutku isteka roka**
Zadano: trenutak je jednak roku kampanje.
Kada: A uplati 0,01 ETH.
Tada: transakcija pada s porukom "Kampanja je istekla".

**K41 — Povrat u trenutku isteka roka**
Zadano: trenutak je jednak roku kampanje, cilj nije dosegnut, A je uplatio 0,05 ETH.
Kada: A pozove refund.
Tada: povrat uspijeva i A dobije 0,05 ETH natrag.

**K42 — Cilj dosegnut točno na granici**
Zadano: cilj je 1 ETH, prikupljeno je točno 1 ETH, rok je istekao.
Kada: vlasnik pozove withdrawFunds.
Tada: isplata uspijeva za 1 ETH.

**K43 — Prikupljeno ispod cilja za najmanji korak**
Zadano: cilj je 1 ETH, prikupljeno je 0,99 ETH, rok je istekao.
Kada: A (uplatitelj) pozove refund.
Tada: povrat uspijeva.

**K44 — Vlasnik ne smije uplaćivati**
Zadano: kampanja traje.
Kada: vlasnik uplati 0,01 ETH.
Tada: transakcija pada s porukom "Vlasnik ne smije uplacivati".

**K45 — Izravno slanje ETH-a ugovoru**
Zadano: ugovor kampanja postoji.
Kada: A pošalje ETH izravno ugovoru bez poziva contribute.
Tada: transakcija pada s porukom "Koristite contribute".

**K46 — Isplata ne dira ETH drugih kampanja**
Zadano: kampanja 1 je uspjela s 1 ETH, kampanja 2 traje s 2 ETH, a u ugovor je prisilno poslano još 0,5 ETH.
Kada: vlasnik isplati kampanju 1.
Tada: vlasnik prima točno 1 ETH, a u ugovoru ostaje 2,5 ETH.

**K47 — Ponovni ulaz pri povratu**
Zadano: A je ugovor koji pri primitku ETH-a ponovno poziva refund, rok je istekao, cilj nije dosegnut, A je uplatio 0,05 ETH.
Kada: A pozove refund.
Tada: A dobije 0,05 ETH samo jednom, a ugniježđeni poziv pada s porukom "Nema uplate za povrat".

**K48 — Ponovni ulaz pri isplati**
Zadano: vlasnik je ugovor koji pri primitku ETH-a ponovno poziva withdrawFunds, kampanja je uspjela.
Kada: vlasnik pozove withdrawFunds.
Tada: isplata se izvrši samo jednom, a ugniježđeni poziv pada s porukom "Sredstva su vec isplacena".

**K49 — Odricanje od vlasništva**
Zadano: pozivatelj je vlasnik.
Kada: pozove renounceOwnership.
Tada: transakcija pada s porukom "Odricanje nije dopusteno".

**K50 — Izdavanje na nultu adresu**
Zadano: pozivatelj je vlasnik.
Kada: pozove mint s nultom adresom.
Tada: transakcija pada s porukom "Adresa nije valjana".

**K51 — Uplata se bilježi i emitira događaj**
Zadano: kampanja traje.
Kada: A uplati 0,05 ETH.
Tada: emitira se događaj uplate s ID-om kampanje, adresom A i iznosom 0,05 ETH.

## Izvan opsega

- Administratori i bilo koja uloga osim vlasnika.
- Spaljivanje tuđih tokena od strane vlasnika.
- Povlačenje uplate prije roka; djelomična isplata; isplata prije isteka roka.
- Ostali moduli (nagradna trgovina, članska iskaznica, glasanje).
- Oporavak vlasništva nakon gubitka ključa.
- Raspodjela prihoda imateljima tokena (vidi Otvorena pitanja 1).

## Otvorena pitanja

1. **Raspodjela prihoda:** opis projekta kaže da token daje udio u prihodu, ali ni jedna odluka ne definira kako se prihod uplaćuje i dijeli. Za sada nije u opsegu.
2. **Metapodaci kampanje:** imaju li kampanje naziv i opis (izvan lanca) i kako se povezuju s ID-om kampanje.
3. **Rezervacije i uplatitelji koji ne povuku povrat:** rezervacija propale kampanje smanjuje se tek kad uplatitelj povuče povrat, pa neaktivni uplatitelji zauzimaju dio granice od 1 000 000 REN. Treba odlučiti je li to prihvatljivo.
4. **Prijenos vlasništva u jednom koraku:** pogrešno upisana valjana adresa trajno gubi izdavanje i isplatu. Prihvaćeno za sada (vidi Odluke o tokenu › Gubitak ključa).
5. **Vlasnik izdaje besplatne tokene sebi:** do granice nerezerviranih tokena. Prihvaćen rizik; odluka o izdavanju samo vlasnika ostaje.
6. **Poruke grešaka:** OpenZeppelin 5.x ERC-20 i Ownable vraćaju prilagođene greške, pa poruke iz kriterija zahtijevaju vlastite provjere s require.

## Sljedivost

(popunjava se u Dijelu 4)
