const { BlockChain, Block } = require('./blockChain1')

let micaNet = new BlockChain()
micaNet.addBlock(new Block(1, "17/11/2025", { amount: 4 }))
micaNet.addBlock(new Block(2, "17/11/2025", { amount: 9 }))

console.log("Blockhain valid ? " + micaNet.isChainValid())
console.log("Changing the block ")
micaNet.chain[1].data={amount:20}
console.log("Blockhain valid ? " + micaNet.isChainValid())
console.log(JSON.stringify(micaNet,null,4))