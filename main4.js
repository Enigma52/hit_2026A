const { BlockChain, Block,Transaction } = require('./blockChain4')
const EC = require('elliptic').ec

const ec = new EC('secp256k1')

const myKey=ec.keyFromPrivate('153dc82883a481f161f2a40073d996bb12ca180f5f8ffc6262e44fb7164ca770')
const myWalletAddress=myKey.getPublic('hex')


let micaNet = new BlockChain()


const tx1 = new Transaction(myWalletAddress, 'address2', 100)
tx1.signTransaction(myKey)
micaNet.addTransaction(tx1)
micaNet.minePendingTransaction(myWalletAddress)

const tx2 = new Transaction(myWalletAddress, 'address3', 20)
tx2.signTransaction(myKey)
micaNet.addTransaction(tx2)
micaNet.minePendingTransaction(myWalletAddress)

console.log(`\n Balance of myWallet is : ${micaNet.getBalanceOfAddress(myWalletAddress)}      `)

