const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('GuessNumberGame', function () {
    let interval = 86400;
    let endTime;
    let accounts;
    let guessNumberGameContract;

    describe('Deployment', function () {
        it('Deploys', async function () {
            const guessNumberGameFactory = await ethers.getContractFactory('GuessNumberGame');
            accounts = await ethers.getSigners();
            endTime = Math.floor(Date.now() / 1000) + interval;
            guessNumberGameContract = await guessNumberGameFactory.deploy(endTime, interval);
            expect(await guessNumberGameContract.deployed()).to.be.ok;
        });

        it('Has the correct endTime', async function () {
            let endTime = await guessNumberGameContract.endTime();
            expect(endTime).to.be.closeTo(Math.floor(Date.now() / 1000) + interval, 5);
        });
    });

    describe('GuessNumberGame is open', function () {
        it('Users should be able to enter any number between 1-10000', async function () {
            for (let account of accounts) {
                let randomNumber = Math.floor(Math.random() * 10000);
                await guessNumberGameContract.connect(account).enter(randomNumber, { value: ethers.utils.parseEther('0.0001') });
                const entries = await guessNumberGameContract.getEntriesForNumber(randomNumber, 1);
                expect(entries).to.include(account.address);
            }
        });

        it('Should fail if entry money not correct', async function () {
            await expect(guessNumberGameContract.connect(accounts[0]).enter(4, { value: ethers.utils.parseEther('0.02') })).to.be.reverted;
        });

        it('Should fail if entry number greater than max number', async function () {
            await expect(guessNumberGameContract.connect(accounts[0]).enter(88888, { value: ethers.utils.parseEther('0.01') })).to.be.reverted;
        });

        it('Should fail to close guessNumberGameContract if round is still open', async function () {
            await expect(guessNumberGameContract.connect(accounts[0]).closeRound(55)).to.be.reverted;
        });
    });

    describe('First round ends with no winners', function () {
        it('Should fail to enter specific round after the round closed', async function () {
            // Move hre 1 round in the future
            let endTime = await guessNumberGameContract.endTime();
            await ethers.provider.send('evm_mine', [Number(endTime)]);
            await expect(guessNumberGameContract.connect(accounts[0]).enter(1, { value: ethers.utils.parseEther('0.001') })).to.be.reverted;
        });

        it('Close GuessNumberGame with no winners', async function () {
            await guessNumberGameContract.closeRound(4);
            expect(await guessNumberGameContract.round()).to.equal(2);
            const entries = await guessNumberGameContract.getEntriesForNumber(4, 1);
            expect(entries).to.be.empty;
        });

        it('Pot should roll over', async function () {
            const pot = await guessNumberGameContract.pot();
            expect(pot).to.equal(ethers.utils.parseEther('0.002'));
        });

        it('End time should push back 1 round from original end time', async function () {
            let roundAfter = endTime + interval;
            expect(await guessNumberGameContract.endTime()).to.equal(roundAfter);
        });
    });

    describe('Second round', function () {
        it('Users enter between 1-3', async function () {
            for (let account of accounts) {
                let randomNumber = Math.floor(Math.random() * 3);
                await guessNumberGameContract.connect(account).enter(randomNumber, { value: ethers.utils.parseEther('0.0001') });
                const entries = await guessNumberGameContract.getEntriesForNumber(randomNumber, 2);
                expect(entries).to.include(account.address);
            }
        });

        it('Choose winners', async function () {
            const winningNumber = 2;

            // Move hre 1 round in the future
            let endTime = await guessNumberGameContract.endTime();
            await ethers.provider.send('evm_mine', [Number(endTime)]);

            const winners = await guessNumberGameContract.getEntriesForNumber(winningNumber, 2);
            let balanceBefore = await ethers.provider.getBalance(winners[0]);
            await guessNumberGameContract.closeRound(winningNumber);

            const balanceAfter = await ethers.provider.getBalance(winners[0]);
            expect(balanceAfter.gt(balanceBefore)).to.be.true;
        });

        it('Should move to round 3', async function () {
            expect(await guessNumberGameContract.round()).to.equal(3);
            expect(await guessNumberGameContract.pot()).to.equal(0);
        });

        it('Add funds sent to contract to pot', async function () {
            await accounts[0].sendTransaction({
                to: guessNumberGameContract.address,
                value: ethers.utils.parseEther('1'),
            });
            expect(await guessNumberGameContract.pot()).to.equal(ethers.utils.parseEther('1'));
        });
    });
});
