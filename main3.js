const { BlockChain, Block,Transaction } = require('./blockChain3')

let micaNet = new BlockChain()
 micaNet.createTransaction(new Transaction('address1','address2',100))
micaNet.createTransaction(new Transaction('address2', 'address1', 50))

console.log('\n Starting the miner')
micaNet.minePendingTransaction('address1')
 
console.log(' \n the Balance fo address1 is  :' +micaNet.getBalanceOfAddress ('address1'))
//console.log(JSON.stringify(micaNet,null,4))