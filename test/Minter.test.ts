import { ethers, waffle } from "hardhat";
import { BigNumber, BigNumberish, ContractReceipt, Wallet } from "ethers"
import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
import { Minter } from "../typechain/Minter"
import { MockERC20 } from "../typechain/MockERC20"
import { BondNFT } from "../typechain/BondNFT"
import { GCD } from "../typechain/GCD"
import { MockAggregator } from "../typechain/MockAggregator"
import { MockPMM } from "../typechain/MockPMM";

use(solidity);

export function expandTo18Decimals(n: BigNumberish): BigNumber {
    const decimals = BigNumber.from(10).pow(18)
    return BigNumber.from(n).mul(decimals)
}

export const timestampSetter: (provider: any) => (timestamp: number) => Promise<void> =
  (provider) => async (timestamp: number) => await provider.send("evm_mine", [timestamp])

export const blockGetter: (provider: any, type: string) => () => Promise<number> =
  (provider, type) => async () => (await provider.getBlock("latest"))[type]

describe("Minter", function () {
    const [wallet, bob, carol, alice, dev] = waffle.provider.getWallets()
    const getTimestamp = blockGetter(waffle.provider, "timestamp");
    const setTimestamp = timestampSetter(waffle.provider);
    const period = 15000;

    let Minter: any
    let ERC20: any
    let NFT: any
    let Aggregator: any
    let PMM: any
    let GCD: any

    let minter: Minter
    let gton: MockERC20
    let gcd: GCD
    let nft: BondNFT
    let gtonPrice: MockAggregator
    let pmmPool: MockPMM

    before(async () => {
        Minter = await ethers.getContractFactory("Minter");
        ERC20 = await ethers.getContractFactory("MockERC20");
        NFT = await ethers.getContractFactory("BondNFT");
        Aggregator = await ethers.getContractFactory("MockAggregator");
        PMM = await ethers.getContractFactory("MockPMM");
        GCD = await ethers.getContractFactory("GCD");
    })

    beforeEach(async () => {
        gtonPrice = await Aggregator.deploy(4, 21000) // 2.1
        nft = await NFT.deploy("BondNFT", "BNFT");
        gton = await ERC20.deploy("Graviton", "GTON");
        await gton.mint(wallet.address, expandTo18Decimals(500000))
        gcd = await GCD.deploy("GravitonUSD", "GCD");
        pmmPool = await PMM.deploy(gton.address, gcd.address);
        minter = await Minter.deploy(
            gton.address,
            gcd.address,
            nft.address,
            gtonPrice.address,
            pmmPool.address,
            2500,
            period
        );
        await gcd.transferOwnership(minter.address);
        await nft.transferOwnership(minter.address);
    })

    it("gcd mint from owner only", async () => {
        await expect(gcd.mint(wallet.address, expandTo18Decimals(10))).to.be.revertedWith("Ownable: caller is not the owner")
    })

    async function mint(user: Wallet, amount: BigNumber): Promise<BigNumber> {
        await gton.approve(minter.address, amount)
        const id = await minter.connect(user).callStatic.mint(amount) // static call allows us to get return value
        await minter.mint(amount)
        return id;
    }

    it("mint should transfer to pmm", async () => {
        const amount = expandTo18Decimals(120)
        await mint(wallet, amount)
        expect(await gton.balanceOf(pmmPool.address)).to.eq(amount);
        // expect(await gcd.balanceOf(pmmPool.address)).to.eq(amount);
    })

    it("mint should issue bond", async () => {
        const amount = expandTo18Decimals(120)
        const id = await mint(wallet, amount)
        expect(await nft.ownerOf(id)).to.be.eq(wallet.address)
    })

    it("can mint and claim", async () => {
        const amount = expandTo18Decimals(120)
        const id = await mint(wallet, amount)
        const ts = await getTimestamp();
        await nft.approve(minter.address, id);
        await expect(minter.claim(id)).to.be.revertedWith("Minter: cannot claim not expired bond");
        await setTimestamp(ts+period);
        await minter.claim(id);
    })

    it("can claim bond once", async () => {
        const amount = expandTo18Decimals(120)
        const id = await mint(wallet, amount)
        const ts = await getTimestamp();
        await nft.approve(minter.address, id);
        await setTimestamp(ts+period);
        await minter.claim(id);
        await expect(minter.claim(id)).to.be.reverted;
    })

    it("cannot claim bond that you don't own", async () => {
        const amount = expandTo18Decimals(120)
        const id = await mint(wallet, amount)
        await expect(minter.connect(alice).claim(id)).to.be.reverted;
    })

    it("claim releases gcd to minter", async () => {
        const amount = expandTo18Decimals(120)
        const id = await mint(wallet, amount)
        const ts = await getTimestamp();
        await nft.approve(minter.address, id);
        await setTimestamp(ts+period);
        await minter.claim(id);
        const [releaseAmount] = await nft.bondInfo(id);
        expect(await gcd.balanceOf(wallet.address)).to.eq(releaseAmount)
    })
});
