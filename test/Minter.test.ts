import { ethers, waffle } from "hardhat";
import { BigNumber, BigNumberish, Wallet } from "ethers"
import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
import { 
    Minter,
    MockERC20,
    BondNFT,
    GCD,
    MockAggregator,
    MockPMM
} from "../types"

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
    const discount = 2500;
    const zeroAddress = "0x0000000000000000000000000000000000000000"

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
            gtonPrice.address, // Need proxy address
            gtonPrice.address, // Need approve address
            pmmPool.address,
            discount,
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
        // static call allows us to get return value without changing the state
        const id = await minter.connect(user).callStatic.mint(amount)
        await minter.connect(user).mint(amount)
        return id;
    }

    async function getGcdMint(amount: BigNumber): Promise<BigNumber> {
        const price = (await gtonPrice.latestRoundData()).answer
        const decimals = await gtonPrice.decimals()
        return amount.mul(price).div(decimals)
    }

    it("mint should transfer to pmm", async () => {
        const amount = expandTo18Decimals(120)
        await mint(wallet, amount)
        const amountWithoutDiscount = await minter.amountWithoutDiscount(amount)
        const pmmPart = await getGcdMint(amountWithoutDiscount)
        expect(await gton.balanceOf(pmmPool.address)).to.eq(amount);
        expect(await gcd.balanceOf(pmmPool.address)).to.eq(pmmPart);
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
        await setTimestamp(ts + period);
        await minter.claim(id);
    })

    it("can claim bond once", async () => {
        const amount = expandTo18Decimals(120)
        const id = await mint(wallet, amount)
        const ts = await getTimestamp();
        await nft.approve(minter.address, id);
        await setTimestamp(ts + period);
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
        await setTimestamp(ts + period);
        await minter.claim(id);
        const [releaseAmount] = await nft.bondInfo(id);
        expect(await gcd.balanceOf(wallet.address)).to.eq(releaseAmount)
    })

    it("correct discount calculation", async () => {
        const amount = expandTo18Decimals(500);
        const amountWithDiscount = amount.div(100).mul(100 - (discount / 100)) // discount has 2 more decimals to save calcs
        const res = await minter.amountWithoutDiscount(amountWithDiscount);
        expect(res).to.eq(amount)
    })

    it("mint call mints correct amount of gcd", async () => {
        const amount = expandTo18Decimals(500);
        const amountWithDiscount = amount.div(100).mul(100 - (discount / 100))
        const amountInUsd = await getGcdMint(amount)
        await gton.approve(minter.address, amountWithDiscount)
        await expect(minter.mint(amountWithDiscount))
            .to.emit(gcd, "Transfer")
            .withArgs(zeroAddress, minter.address, amountInUsd.mul(2)); // mints doubled amount of gcd
    })
});
