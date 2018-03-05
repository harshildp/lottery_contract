const assert = require('assert');
const ganache = require('ganache-cli');
const provider = ganache.provider();
const Web3 = require('web3');
const web3 = new Web3(provider);
const { interface, bytecode } = require('../compile');

let lottery;
let accounts;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ data: bytecode })
        .send({ from: accounts[0], gas: '1000000' });

    lottery.setProvider(provider);
});

describe('Lottery contract', () => {
    it('was successfully deployed', () => {
        assert.ok(lottery.options.address);
    });

    it('allows entry to lottery', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });
        
        const players = await lottery.methods.getPlayers().call({ from: accounts[0] });

        assert.equal(accounts[0], players[0]);
        assert.equal(1, players.length);
    });

    it('allows multiple entries to lottery', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });

        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.02', 'ether')
        });

        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.02', 'ether')
        });

        const players = await lottery.methods.getPlayers().call({ from: accounts[0] });

        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
        assert.equal(3, players.length);
    });

    it('requires a minimum value of ether to enter', async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: '10'
            });
            assert(false);
        } catch (err) {
            assert(err);
        }
    });

    it('requires manager to pick winner', async () => {
        try {
            await lottery.methods.pickWinner().send({ from: accounts[1] });
            assert(false);
        } catch (err) {
            assert(err);
        }
    });

    it('sends money to winner and resets players array', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('2', 'ether')
        });

        const initialBalance = await web3.eth.getBalance(accounts[0]);
        await lottery.methods.pickWinner().send({ from: accounts[0] });
        const postBalance = await web3.eth.getBalance(accounts[0]);    

        const players = await lottery.methods.getPlayers().call({ from: accounts[0] });
        const contractBalance = await web3.eth.getBalance(lottery.options.address);

        assert(postBalance > initialBalance);
        assert.equal(0, players.length);
        assert.equal(0, contractBalance);
    });
});