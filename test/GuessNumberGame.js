const { expect } = require('chai');
const { ethers } = require('hardhat');
const airnodeProtocol = require('@api3/airnode-protocol');
const airnodeAdmin = require('@api3/airnode-admin');

describe('GuessNumberGame', function () {
    let guessNumberGameContract, accounts, endTime;
    let interval = 86400;

    describe('Deployment', function () {
        it('Deploys', async function () {
            accounts = await ethers.getSigners();
            endTime = Math.floor(Date.now() / 1000) + interval;

            let { chainId } = await ethers.provider.getNetwork(); // Get the chainId we are using in hardhat
            const rrpAddress = airnodeProtocol.AirnodeRrpAddresses[chainId]; // Get the AirnodeRrp address for the chainId

            const GuessNumberGame = await ethers.getContractFactory('GuessNumberGame');
            guessNumberGameContract = await GuessNumberGame.deploy(endTime, interval, rrpAddress);
            expect(await guessNumberGameContract.deployed()).to.be.ok;
        });

        it('Sets sponsor wallet', async function () {
            const sponsorWalletAddress = await airnodeAdmin.deriveSponsorWalletAddress(
                'xpub6DF9CEitAcAzWmdCpSJ3nmc18L1NDzCMXtX81eGCiScdkgcV1G1Xo7tYFnVsqNZSurAwPKpKs3W2VXKyBytLg89VSvD1Rh4JxchMBTCLxjC',
                '0x4f15d2ECFc6b960eB5a4C22075788e7Ac9326437',
                guessNumberGameContract.address
            );
            await expect(guessNumberGameContract.connect(accounts[1]).setSponsorWallet(sponsorWalletAddress)).to.be.reverted; // onlyOwner
            await guessNumberGameContract.setSponsorWallet(sponsorWalletAddress);

            expect(await guessNumberGameContract.sponsorWallet()).to.equal(sponsorWalletAddress);
        });

        it('Has the correct endTime', async function () {
            let endTime = await guessNumberGameContract.endTime();
            expect(endTime).to.be.closeTo(Math.floor(Date.now() / 1000) + interval, 5);
        });
    });

    describe('GuessNumberGame is open', function () {
        it('Users enter between 1-3', async function () {
            for (let account of accounts) {
                let randomNumber = Math.floor(Math.random() * 3);
                await guessNumberGameContract.connect(account).enter(randomNumber, { value: ethers.utils.parseEther('0.0001') });
                const entries = await guessNumberGameContract.getEntriesForNumber(randomNumber, 1);
                expect(entries).to.include(account.address);
            }
        });

        it('Should fail if entry is invalid', async function () {
            await expect(guessNumberGameContract.connect(accounts[0]).enter(4, { value: ethers.utils.parseEther('0.02') })).to.be.reverted; // exact ticket price only
            await expect(guessNumberGameContract.connect(accounts[0]).enter(65539, { value: ethers.utils.parseEther('0.01') })).to.be.reverted; // number too high
        });
    });

    describe('First week ends with no winners', function () {
        it('Should fail to enter', async function () {
            // Move hre 1 week in the future
            let endTime = await guessNumberGameContract.endTime();
            await ethers.provider.send('evm_mine', [Number(endTime)]);
            await expect(guessNumberGameContract.connect(accounts[0]).enter(1, { value: ethers.utils.parseEther('0.001') })).to.be.reverted;
        });

        it('Close GuessNumberGame with no winners', async function () {
            await guessNumberGameContract.getWinningNumberAndCloseRound({ value: ethers.utils.parseEther('0.01') });
            expect(await guessNumberGameContract.round()).to.equal(2);
            const entries = await guessNumberGameContract.getEntriesForNumber(4, 1);
            expect(entries).to.be.empty;
        });

        it('Pot should roll over', async function () {
            const pot = await guessNumberGameContract.pot();
            expect(pot).to.equal(ethers.utils.parseEther('0.002'));
        });

        it('End time should push back 1 day from original end time', async function () {
            let roundAfter = endTime + interval;
            expect(await guessNumberGameContract.endTime()).to.equal(roundAfter);
        });
    });
});
