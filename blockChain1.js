const SHA256=require("crypto-js/sha256")
class Block{
    constructor(index, timeStamp, data, previousHash = '') {
        this.index = index
        this.previousHash = previousHash
        this.timeStamp = timeStamp
        this.data = data
        this.hash=this.calculateHash()
    }
    calculateHash() {
        return SHA256(this.index+this.previousHash+this.timeStamp+JSON.stringify(this.data)).toString()
    }
}

class BlockChain{
    constructor() {
        this.chain=[this.createGenesisBlock()]
    }
    createGenesisBlock() {
        return new Block(0,"01/09/2009","Genesis Block",0)
    }
    getLatestBlock() {
        return this.chain[this.chain.length-1]
    }
    addBlock(newBlock) {
        newBlock.previousHash = this.getLatestBlock().hash
        newBlock.hash = newBlock.calculateHash()
        this.chain.push(newBlock)
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
module.exports.Block=Block