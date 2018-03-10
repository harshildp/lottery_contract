const path = require('path');
const fs = require('fs');
const solc = require('solc'); // solidity compiler

const lotteryPath = path.resolve(__dirname, 'contracts', 'Lottery.sol');
const source = fs.readFileSync(lotteryPath, 'utf8');

// requires location, number of contracts and contract names in an array
module.exports = solc.compile(source, 1).contracts[':Lottery'];




