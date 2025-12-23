const SHA256=require("crypto-js/sha256")
class Transaction{
    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress 
        this.toAddress=toAddress
        this.amount=amount
   }
}

class Block{
    constructor( timeStamp, transactions, previousHash = '') {
        this.previousHash = previousHash
        this.timeStamp = timeStamp
        this.transactions = transactions
        this.hash = this.calculateHash()
        this.nonce = 0;
    }
    calculateHash() {
        return SHA256(this.previousHash+this.timeStamp+JSON.stringify(this.transactions)+this.nonce).toString()
    }
    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++
            this.hash = this.calculateHash()
        }
        console.log("Block mined: "+this.calculateHash())
    }
}

class BlockChain{
    constructor() {
        this.chain = [this.createGenesisBlock()]
        this.difficulty = 5
        this.pendingTransactions = []
        this.miningRewards=100
    }
    createGenesisBlock() {
        return new Block("01/09/2009","Genesis Block",0)
    }
    getLatestBlock() {
        return this.chain[this.chain.length-1]
    }
    // addBlock(newBlock) {
    //     newBlock.previousHash = this.getLatestBlock().hash
    //     newBlock.mineBlock (this.difficulty)
    //     this.chain.push(newBlock)
    // }
    minePendingTransaction(miningRewardAddress) {
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningRewards)
        this.pendingTransactions.push(rewardTx)
        let block=new Block(Date.now(),this.pendingTransactions,this.getLatestBlock().hash)
        block.mineBlock(this.difficulty)
        console.log('Block mined successfully ')
        this.chain.push(block)
        this.pendingTransactions=[]
    }
    createTransaction(transaction) {
        this.pendingTransactions.push(transaction)
    }

    getBalanceOfAddress(address) {
        let balance = 0
        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.fromAddress === address) {
                    balance -= trans.amount
                }
                if (trans.toAddress === address) {
                    balance +=trans.amount

                }


            }
        }

       return balance
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++){
            const currentBlock = this.chain[i]
            const previousBlock= this.chain[i-1]
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false
            }
            if (currentBlock.previousHash !== previousBlock.hash) {
                return false
            } 
        
        }
       return true
     }

}
module.exports.BlockChain = BlockChain
module.exports.Block = Block
module.exports.Transaction=Transaction