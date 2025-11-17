const { BlockChain, Block } = require('./blockChain0')

let micaNet = new BlockChain()
micaNet.addBlock(new Block(1, "17/11/2025", { amount: 4 }))
micaNet.addBlock(new Block(2, "17/11/2025", { amount: 9 }))
console.log(JSON.stringify(micaNet,null,4))