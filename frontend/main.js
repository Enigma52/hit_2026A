const ABI = [
  "function addCandidate(string name, int8[3] positions)",
  "function prepareVoterBook(bytes32 merkleRoot)",
  "function scheduleElection(uint256 startTime, uint256 endTime)",
  "function getResultsSorted() view returns (uint256[] ids, uint256[] voteCounts)",
  "function candidates(uint256) view returns (string name, int8[3] positions, uint256 votes, bool exists)"
];

let signer;
let contract;

const log = (msg) => {
  const box = document.getElementById("log");
  box.textContent = `[${new Date().toLocaleTimeString()}] ${msg}\n` + box.textContent;
};

async function connect() {
  if (!window.ethereum) throw new Error("No wallet found (MetaMask)");
  const provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  const address = document.getElementById("contractAddress").value.trim();
  contract = new ethers.Contract(address, ABI, signer);
  log(`Connected as ${await signer.getAddress()}`);
}

async function sendTx(action) {
  if (!contract) throw new Error("Connect first");
  const tx = await action();
  log(`tx submitted: ${tx.hash}`);
  await tx.wait();
  log("tx mined");
}

document.getElementById("connectBtn").onclick = async () => {
  try { await connect(); } catch (e) { log(e.message); }
};

document.getElementById("addCandBtn").onclick = async () => {
  try {
    const name = document.getElementById("candName").value;
    const p = ["p0", "p1", "p2"].map((id) => Number(document.getElementById(id).value));
    await sendTx(() => contract.addCandidate(name, p));
  } catch (e) { log(e.shortMessage || e.message); }
};

document.getElementById("setMerkleBtn").onclick = async () => {
  try {
    const root = document.getElementById("merkleRoot").value.trim();
    await sendTx(() => contract.prepareVoterBook(root));
  } catch (e) { log(e.shortMessage || e.message); }
};

document.getElementById("scheduleBtn").onclick = async () => {
  try {
    const start = document.getElementById("startTs").value;
    const end = document.getElementById("endTs").value;
    await sendTx(() => contract.scheduleElection(start, end));
  } catch (e) { log(e.shortMessage || e.message); }
};

document.getElementById("resultsBtn").onclick = async () => {
  try {
    const [ids, counts] = await contract.getResultsSorted();
    const ranking = document.getElementById("ranking");
    ranking.innerHTML = "";

    for (let i = 0; i < ids.length; i++) {
      const c = await contract.candidates(ids[i]);
      const li = document.createElement("li");
      li.textContent = `${c.name} — ${counts[i]} votes`;
      ranking.appendChild(li);
    }

    if (ids.length > 0) log(`Winner: candidate #${ids[0]}`);
  } catch (e) { log(e.shortMessage || e.message); }
};
