// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IRenoFundToken} from "./IRenoFund.sol";

/// @title RenoFundToken
/// @notice Token RENO (REN), 0 decimala. Implementacija IRenoFundToken prema docs/SPEC.md.
contract RenoFundToken is ERC20, Ownable, IRenoFundToken {
    uint256 public constant MAX_SUPPLY = 1_000_000;
    uint256 public constant MAX_MINT = 10_000;

    address private _campaignContract;
    uint256 private _reservedTokens;

    modifier onlyCampaign() {
        require(
            _campaignContract != address(0) && msg.sender == _campaignContract,
            "Ugovor kampanja nije ovlasten"
        );
        _;
    }

    constructor() ERC20("RENO", "REN") Ownable(msg.sender) {}

    // ---------------------------------------------------------------
    // Izdavanje, rezervacije, administracija
    // ---------------------------------------------------------------

    function mint(address to, uint256 amount) external override {
        bool fromCampaign = _campaignContract != address(0) && msg.sender == _campaignContract;
        require(msg.sender == owner() || fromCampaign, "Samo vlasnik smije pozvati");
        require(to != address(0), "Adresa nije valjana");
        require(amount > 0, "Iznos mora biti veci od nule");
        // Ograniceno izdavanje od 10 000 REN ne vrijedi za preuzimanje (ugovor kampanja).
        require(fromCampaign || amount <= MAX_MINT, "Iznos prelazi 10000 REN po izdavanju");
        require(
            totalSupply() + _reservedTokens + amount <= MAX_SUPPLY,
            "Prekoracena ukupna kolicina od 1000000 REN"
        );
        _mint(to, amount);
    }

    function setCampaignContract(address addr) external override {
        require(msg.sender == owner(), "Samo vlasnik smije pozvati");
        require(addr != address(0), "Adresa nije valjana");
        require(_campaignContract == address(0), "Ugovor kampanja je vec postavljen");
        _campaignContract = addr;
        emit CampaignContractSet(addr);
    }

    function reserve(uint256 amount) external override onlyCampaign {
        require(
            totalSupply() + _reservedTokens + amount <= MAX_SUPPLY,
            "Prekoracena ukupna kolicina od 1000000 REN"
        );
        _reservedTokens += amount;
    }

    function release(uint256 amount) external override onlyCampaign {
        require(amount <= _reservedTokens, "Nedovoljno rezerviranih tokena");
        _reservedTokens -= amount;
    }

    function renounceOwnership() public pure override(Ownable, IRenoFundToken) {
        revert("Odricanje nije dopusteno");
    }

    function transferOwnership(address newOwner) public override(Ownable, IRenoFundToken) {
        require(msg.sender == owner(), "Samo vlasnik smije pozvati");
        require(newOwner != address(0), "Nova adresa nije valjana");
        _transferOwnership(newOwner);
    }

    // ---------------------------------------------------------------
    // Spaljivanje i prijenosi
    // ---------------------------------------------------------------

    function burn(uint256 amount) external override {
        require(balanceOf(msg.sender) >= amount, "Nedovoljno tokena za spaljivanje");
        _burn(msg.sender, amount);
    }

    function transfer(address to, uint256 amount)
        public
        override(ERC20, IERC20)
        returns (bool)
    {
        require(balanceOf(msg.sender) >= amount, "Nedovoljno stanja");
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount)
        public
        override(ERC20, IERC20)
        returns (bool)
    {
        require(balanceOf(from) >= amount, "Nedovoljno stanja");
        require(allowance(from, msg.sender) >= amount, "Nedovoljno odobrenje");
        return super.transferFrom(from, to, amount);
    }

    // ---------------------------------------------------------------
    // Citanje i prevladavanje (override)
    // ---------------------------------------------------------------

    function decimals() public pure override(ERC20, IERC20Metadata) returns (uint8) {
        return 0;
    }

    function campaignContract() external view override returns (address) {
        return _campaignContract;
    }

    function reservedTokens() external view override returns (uint256) {
        return _reservedTokens;
    }

    function owner() public view override(Ownable, IRenoFundToken) returns (address) {
        return super.owner();
    }
}
