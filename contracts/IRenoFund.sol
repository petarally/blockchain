// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/// @title IRenoFundToken
/// @notice Token RENO (REN): token, uloge i administracija. Izvor: docs/SPEC.md.
/// @dev Samo sucelje, bez implementacije. Konstante: decimale 0,
///      najvise 1 000 000 REN ukupno, najvise 10 000 REN po izdavanju.
///
///      ERC-20 dio nasljeduje se iz OpenZeppelina (IERC20, IERC20Metadata) i ovdje se ne
///      ponavlja. Funkcije i dogadaji, s ulogama i kriterijima:
///      - transfer(to, amount): bilo koji imatelj. SPEC: K6, K7
///      - approve(spender, amount): bilo koji imatelj. SPEC: K8
///      - transferFrom(from, to, amount): odobreni potrosac. SPEC: K8
///      - balanceOf, totalSupply, allowance: bilo tko. SPEC: K1, K4, K6, K8, K9, K38, K39
///      - name (RENO), symbol (REN), decimals (0): bilo tko. SPEC: odluke o tokenu
///      - dogadaji Transfer i Approval (IERC20)
///      OwnershipTransferred deklarira OpenZeppelin Ownable u implementaciji; IERC173 se
///      ne koristi jer deklarira isti dogadaj pa se zajedno s Ownable ne prevodi.
interface IRenoFundToken is IERC20, IERC20Metadata {
    // ---------------------------------------------------------------
    // Dogadaji
    // ---------------------------------------------------------------

    /// @notice Postavljen je ugovor kampanja koji smije izdavati tokene pri preuzimanju.
    event CampaignContractSet(address indexed campaignContract);

    // ---------------------------------------------------------------
    // Funkcije promjene stanja
    // ---------------------------------------------------------------

    /// @notice Izdaje `amount` REN adresi `to`.
    /// @dev Uloga: vlasnik; ugovor kampanja samo unutar claimTokens (nakon setCampaignContract),
    ///      bez limita od 10 000 REN po izdavanju.
    ///      Redoslijed provjera: vlasnik, adresa, iznos 0, limit po izdavanju, ukupna granica.
    ///      SPEC: K1, K2, K3, K4, K5, K38, K39, K50
    function mint(address to, uint256 amount) external;

    /// @notice Jednom postavlja ugovor kampanja koji smije izdavati tokene pri preuzimanju.
    /// @dev Uloga: samo vlasnik, jednom.
    ///      SPEC: K37
    function setCampaignContract(address addr) external;

    /// @notice Odricanje od vlasnistva nije dopusteno; uvijek pada.
    /// @dev Uloga: nitko.
    ///      SPEC: K49
    function renounceOwnership() external;

    /// @notice Spaljuje `amount` vlastitih tokena pozivatelja.
    /// @dev Uloga: bilo koji imatelj (ukljucujuci vlasnika), samo vlastite tokene.
    ///      SPEC: K9, K10, K38
    function burn(uint256 amount) external;

    /// @notice Prenosi vlasnistvo na `newOwner`.
    /// @dev Uloga: samo vlasnik.
    ///      SPEC: K11
    function transferOwnership(address newOwner) external;

    /// @notice Povecava rezervirane tokene za `amount` (uplata u kampanju).
    /// @dev Uloga: samo ugovor kampanja. Dodano uz SPEC jer sucelje nije imalo put za
    ///      promjenu rezervacije (SPEC: Odluke o modulu > Rezervacija tokena; K35).
    function reserve(uint256 amount) external;

    /// @notice Smanjuje rezervirane tokene za `amount` (povrat ili preuzimanje tokena).
    /// @dev Uloga: samo ugovor kampanja. Pri preuzimanju se poziva prije mint.
    ///      Dodano uz SPEC (SPEC: Odluke o modulu > Rezervacija tokena; K31, K21).
    function release(uint256 amount) external;

    // ---------------------------------------------------------------
    // Funkcije citanja
    // ---------------------------------------------------------------

    /// @dev Uloga: bilo tko. SPEC: K2, K11
    function owner() external view returns (address);

    /// @dev Uloga: bilo tko. SPEC: K36, K37
    function campaignContract() external view returns (address);

    /// @dev Uloga: bilo tko. Tokeni koje kampanje vec duguju uplatiteljima. SPEC: K35, K39
    function reservedTokens() external view returns (uint256);
}

/// @title IRenoFundModul
/// @notice Modul "Skupljanje sredstava (ETH)": kampanje. Izvor: docs/SPEC.md.
/// @dev Samo sucelje, bez implementacije.
///      receive/fallback: izravno slanje ETH-a ugovoru uvijek pada s porukom
///      "Koristite contribute" (SPEC: K45); sucelje ih ne moze deklarirati.
interface IRenoFundModul {
    // ---------------------------------------------------------------
    // Dogadaji
    // ---------------------------------------------------------------

    /// @notice Otvorena je kampanja.
    event CampaignCreated(uint256 indexed id, uint256 goal, uint256 deadline);

    /// @notice Uplata u kampanju. SPEC: K51
    event Contributed(uint256 indexed id, address indexed contributor, uint256 amount);

    /// @notice Povrat uplate propale kampanje.
    event Refunded(uint256 indexed id, address indexed contributor, uint256 amount);

    /// @notice Isplata prikupljenih sredstava vlasniku.
    event FundsWithdrawn(uint256 indexed id, address indexed owner, uint256 amount);

    /// @notice Preuzimanje tokena uspjele kampanje.
    event TokensClaimed(uint256 indexed id, address indexed contributor, uint256 amount);

    // ---------------------------------------------------------------
    // Funkcije promjene stanja
    // ---------------------------------------------------------------

    /// @notice Otvara kampanju s ciljem u wei i trajanjem od 1 do 90 dana; rok je od trenutka otvaranja.
    /// @dev Uloga: samo vlasnik. Vraca ID nove kampanje.
    ///      SPEC: K12, K13, K14, K15
    function createCampaign(uint256 goal, uint256 durationDays) external returns (uint256 id);

    /// @notice Uplacuje ETH u kampanju i rezervira 1 REN po 0,01 ETH.
    /// @dev Uloga: bilo tko osim vlasnika.
    ///      Redoslijed provjera: kampanja, vlasnik, rok, minimum, visekratnik, tokeni.
    ///      SPEC: K16, K17, K18, K19, K20, K35, K40, K44, K46, K51
    function contribute(uint256 campaignId) external payable;

    /// @notice Vraca cijelu uplatu pozivatelja i smanjuje rezervaciju; tek kad je rok istekao, a cilj nije dosegnut.
    /// @dev Uloga: uplatitelj (ukljucujuci vlasnika za svoju uplatu).
    ///      SPEC: K21, K22, K23, K24, K41, K43, K47
    function refund(uint256 campaignId) external;

    /// @notice Salje zabiljezeni prikupljeni iznos vlasniku; jednom po kampanji.
    /// @dev Uloga: samo vlasnik. Slanje kroz call s provjerom uspjeha.
    ///      SPEC: K25, K26, K27, K28, K29, K30, K42, K46, K48
    function withdrawFunds(uint256 campaignId) external;

    /// @notice Izdaje pozivatelju (ukupna uplata / 0,01 ETH) REN i smanjuje rezervaciju; jednom po uplatitelju.
    /// @dev Uloga: uplatitelj (ukljucujuci vlasnika za svoju uplatu). Tokene izdaje ugovor kampanja.
    ///      SPEC: K31, K32, K33, K34, K36
    function claimTokens(uint256 campaignId) external;

    // ---------------------------------------------------------------
    // Funkcije citanja
    // ---------------------------------------------------------------

    /// @dev Uloga: bilo tko. Rok je Unix vrijeme u sekundama.
    ///      SPEC: K12, K25, K28
    function campaigns(uint256 id)
        external
        view
        returns (uint256 goal, uint256 deadline, uint256 raised, bool paidOut);

    /// @dev Uloga: bilo tko. Uplaceni iznos u wei. SPEC: K16, K21
    function contributions(uint256 id, address addr) external view returns (uint256);

    /// @dev Uloga: bilo tko. Oznaka preuzeto. SPEC: K31, K32
    function claimed(uint256 id, address addr) external view returns (bool);

    /// @dev Uloga: bilo tko. SPEC: K12, K20
    function campaignCount() external view returns (uint256);
}
