import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("RenoFundToken", () => {
  async function deploy() {
    const [owner, a, b, c, campaign] = await ethers.getSigners();
    const token = await ethers.deployContract("RenoFundToken");
    return { token, owner, a, b, c, campaign };
  }

  // Pomocno: dovodi ukupnu kolicinu na zadanu vrijednost izdavanjem po 10 000.
  async function mintTo(token: any, to: string, total: number) {
    let left = total;
    while (left > 0) {
      const n = Math.min(left, 10_000);
      await token.mint(to, n);
      left -= n;
    }
  }

  it("ima naziv RENO, oznaku REN i 0 decimala", async () => {
    const { token } = await deploy();
    expect(await token.name()).to.equal("RENO");
    expect(await token.symbol()).to.equal("REN");
    expect(await token.decimals()).to.equal(0n);
  });

  describe("mint", () => {
    it("K1: vlasnik izdaje 10000 REN", async () => {
      const { token, a } = await deploy();
      await token.mint(a.address, 10_000);
      expect(await token.balanceOf(a.address)).to.equal(10_000n);
      expect(await token.totalSupply()).to.equal(10_000n);
    });
    it("K2: nevlasnik ne smije izdavati", async () => {
      const { token, a } = await deploy();
      await expect(token.connect(a).mint(a.address, 1)).to.be.revertedWith("Samo vlasnik smije pozvati");
    });
    it("K3: iznad 10000 po izdavanju", async () => {
      const { token, a } = await deploy();
      await expect(token.mint(a.address, 10_001)).to.be.revertedWith("Iznos prelazi 10000 REN po izdavanju");
    });
    it("K4: iznad ukupne granice", async () => {
      const { token, a } = await deploy();
      await mintTo(token, a.address, 995_000);
      await expect(token.mint(a.address, 10_000)).to.be.revertedWith("Prekoracena ukupna kolicina od 1000000 REN");
    });
    it("K5: iznos nula", async () => {
      const { token, a } = await deploy();
      await expect(token.mint(a.address, 0)).to.be.revertedWith("Iznos mora biti veci od nule");
    });
    it("K50: nulta adresa", async () => {
      const { token } = await deploy();
      await expect(token.mint(ethers.ZeroAddress, 1)).to.be.revertedWith("Adresa nije valjana");
    });
    it("K38: spaljivanje oslobada mjesto do granice", async () => {
      const { token, a } = await deploy();
      await mintTo(token, a.address, 1_000_000);
      await expect(token.mint(a.address, 10)).to.be.revertedWith("Prekoracena ukupna kolicina od 1000000 REN");
      await token.connect(a).burn(10);
      await token.mint(a.address, 10);
      expect(await token.totalSupply()).to.equal(1_000_000n);
    });
    it("ugovor kampanja izdaje bez limita od 10000", async () => {
      const { token, a, campaign } = await deploy();
      await token.setCampaignContract(campaign.address);
      await token.connect(campaign).mint(a.address, 20_000);
      expect(await token.balanceOf(a.address)).to.equal(20_000n);
    });
    it("ugovor kampanja i dalje ne smije preko ukupne granice", async () => {
      const { token, a, campaign } = await deploy();
      await token.setCampaignContract(campaign.address);
      await mintTo(token, a.address, 990_000);
      await expect(token.connect(campaign).mint(a.address, 10_001)).to.be.revertedWith(
        "Prekoracena ukupna kolicina od 1000000 REN",
      );
    });
  });

  describe("setCampaignContract", () => {
    it("K37: postavlja jednom, drugi put pada", async () => {
      const { token, a, campaign } = await deploy();
      await expect(token.setCampaignContract(campaign.address))
        .to.emit(token, "CampaignContractSet")
        .withArgs(campaign.address);
      expect(await token.campaignContract()).to.equal(campaign.address);
      await expect(token.setCampaignContract(a.address)).to.be.revertedWith("Ugovor kampanja je vec postavljen");
    });
    it("pada za nevlasnika", async () => {
      const { token, a } = await deploy();
      await expect(token.connect(a).setCampaignContract(a.address)).to.be.revertedWith("Samo vlasnik smije pozvati");
    });
    it("pada za nultu adresu", async () => {
      const { token } = await deploy();
      await expect(token.setCampaignContract(ethers.ZeroAddress)).to.be.revertedWith("Adresa nije valjana");
    });
  });

  describe("reserve / release", () => {
    it("reserve povecava, release smanjuje rezervirane tokene", async () => {
      const { token, campaign } = await deploy();
      await token.setCampaignContract(campaign.address);
      await token.connect(campaign).reserve(25);
      expect(await token.reservedTokens()).to.equal(25n);
      await token.connect(campaign).release(10);
      expect(await token.reservedTokens()).to.equal(15n);
    });
    it("reserve pada za pozivatelja koji nije ugovor kampanja", async () => {
      const { token, a, campaign } = await deploy();
      await token.setCampaignContract(campaign.address);
      await expect(token.connect(a).reserve(1)).to.be.revertedWith("Ugovor kampanja nije ovlasten");
      await expect(token.reserve(1)).to.be.revertedWith("Ugovor kampanja nije ovlasten");
    });
    it("reserve pada dok ugovor kampanja nije postavljen", async () => {
      const { token, a } = await deploy();
      await expect(token.connect(a).reserve(1)).to.be.revertedWith("Ugovor kampanja nije ovlasten");
    });
    it("reserve pada iznad ukupne granice", async () => {
      const { token, a, campaign } = await deploy();
      await token.setCampaignContract(campaign.address);
      await mintTo(token, a.address, 999_990);
      await expect(token.connect(campaign).reserve(25)).to.be.revertedWith(
        "Prekoracena ukupna kolicina od 1000000 REN",
      );
    });
    it("release pada za nevlasnika kampanja i za vise od rezerviranog", async () => {
      const { token, a, campaign } = await deploy();
      await token.setCampaignContract(campaign.address);
      await expect(token.connect(a).release(1)).to.be.revertedWith("Ugovor kampanja nije ovlasten");
      await expect(token.connect(campaign).release(1)).to.be.revertedWith("Nedovoljno rezerviranih tokena");
    });
    it("K39: izdavanje ne smije uci u rezervirane tokene", async () => {
      const { token, a, campaign } = await deploy();
      await token.setCampaignContract(campaign.address);
      await mintTo(token, a.address, 990_000);
      await token.connect(campaign).reserve(10_000);
      await expect(token.mint(a.address, 1)).to.be.revertedWith("Prekoracena ukupna kolicina od 1000000 REN");
    });
  });

  describe("renounceOwnership / transferOwnership", () => {
    it("K49: odricanje nije dopusteno", async () => {
      const { token, owner } = await deploy();
      await expect(token.renounceOwnership()).to.be.revertedWith("Odricanje nije dopusteno");
      expect(await token.owner()).to.equal(owner.address);
    });
    it("K11: prijenos na nultu adresu pada", async () => {
      const { token } = await deploy();
      await expect(token.transferOwnership(ethers.ZeroAddress)).to.be.revertedWith("Nova adresa nije valjana");
    });
    it("prijenos vlasnistva uspijeva", async () => {
      const { token, a } = await deploy();
      await expect(token.transferOwnership(a.address)).to.emit(token, "OwnershipTransferred");
      expect(await token.owner()).to.equal(a.address);
    });
    it("prijenos vlasnistva pada za nevlasnika", async () => {
      const { token, a } = await deploy();
      await expect(token.connect(a).transferOwnership(a.address)).to.be.revertedWith("Samo vlasnik smije pozvati");
    });
  });

  describe("burn", () => {
    it("K9: spaljuje vlastite tokene", async () => {
      const { token, a } = await deploy();
      await token.mint(a.address, 10);
      await token.connect(a).burn(4);
      expect(await token.balanceOf(a.address)).to.equal(6n);
      expect(await token.totalSupply()).to.equal(6n);
    });
    it("K10: vise nego sto imatelj ima", async () => {
      const { token, a } = await deploy();
      await token.mint(a.address, 3);
      await expect(token.connect(a).burn(4)).to.be.revertedWith("Nedovoljno tokena za spaljivanje");
    });
  });

  describe("transfer", () => {
    it("K6: uspjeh", async () => {
      const { token, a, b } = await deploy();
      await token.mint(a.address, 10);
      await token.connect(a).transfer(b.address, 4);
      expect(await token.balanceOf(a.address)).to.equal(6n);
      expect(await token.balanceOf(b.address)).to.equal(4n);
    });
    it("K7: nedovoljno stanja", async () => {
      const { token, a, b } = await deploy();
      await token.mint(a.address, 3);
      await expect(token.connect(a).transfer(b.address, 4)).to.be.revertedWith("Nedovoljno stanja");
    });
  });

  describe("approve / transferFrom / allowance", () => {
    it("approve postavlja odobrenje, transferFrom ga trosi", async () => {
      const { token, a, b, c } = await deploy();
      await token.mint(a.address, 10);
      await token.connect(a).approve(c.address, 5);
      expect(await token.allowance(a.address, c.address)).to.equal(5n);
      await token.connect(c).transferFrom(a.address, b.address, 3);
      expect(await token.balanceOf(b.address)).to.equal(3n);
      expect(await token.allowance(a.address, c.address)).to.equal(2n);
    });
    it("K8: transferFrom bez dovoljnog odobrenja", async () => {
      const { token, a, b, c } = await deploy();
      await token.mint(a.address, 10);
      await token.connect(a).approve(c.address, 2);
      await expect(token.connect(c).transferFrom(a.address, b.address, 3)).to.be.revertedWith("Nedovoljno odobrenje");
    });
    it("transferFrom pada kad vlasnik nema dovoljno stanja", async () => {
      const { token, a, b, c } = await deploy();
      await token.mint(a.address, 3);
      await token.connect(a).approve(c.address, 10);
      await expect(token.connect(c).transferFrom(a.address, b.address, 4)).to.be.revertedWith("Nedovoljno stanja");
    });
  });
});
