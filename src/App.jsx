import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ArrowDown, RefreshCw, Plus, Twitter, Github } from 'lucide-react';

const ROUTER_ADDRESS = "0xB0aA1d29339bdFaC68a791d4C13b0698A239D97C";
const WETH_ADDRESS = "0xc2F331332ca914685D773781744b1C589861C9Aa";

const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)"
];

const ERC20_ABI = ["function approve(address spender, uint256 amount) external returns (bool)", "function allowance(address owner, address spender) view returns (uint256)"];

export default function App() {
  const [tab, setTab] = useState('swap');
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [provider, setProvider] = useState(null);
  const [router, setRouter] = useState(null);

  const tokens = [
    { name: "X1T (Native)", symbol: "X1T", address: WETH_ADDRESS, isNative: true },
    { name: "TKA", symbol: "TKA", address: "0x6cF0576a5088ECE1cbc92cbDdD2496c8de5517FB", isNative: false },
    { name: "TKB", symbol: "TKB", address: "0x2C71ab7D51251BADaE2729E3F842c43fc6BB68c5", isNative: false }
  ];

  const [tokenA, setTokenA] = useState(tokens[0]);
  const [tokenB, setTokenB] = useState(tokens[1]);

  // HARGA REALISTIS & CEPAT
  useEffect(() => {
    const fetchPrice = async () => {
      if (!amountA || !router || tab !== 'swap' || tokenA.address === tokenB.address) {
        setAmountB('');
        return;
      }
      try {
        const path = [tokenA.address, tokenB.address];
        const amounts = await router.getAmountsOut(ethers.parseEther(amountA), path);
        setAmountB(ethers.formatEther(amounts[1]));
      } catch (e) { setAmountB("No Pool"); }
    };
    fetchPrice();
  }, [amountA, tokenA, tokenB, router, tab]);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install MetaMask");
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const prov = new ethers.BrowserProvider(window.ethereum);
    setAccount(accounts[0]);
    setProvider(prov);
    setRouter(new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, await prov.getSigner()));
  };

  const handleAction = async () => {
    if (!account) return connectWallet();
    setLoading(true);
    try {
      const sig = await provider.getSigner();
      const deadline = Math.floor(Date.now() / 1000) + 1200;
      const valA = ethers.parseEther(amountA || "0");
      const valB = ethers.parseEther(amountB === "No Pool" ? "0" : amountB || "0");

      if (!tokenA.isNative) {
        const contract = new ethers.Contract(tokenA.address, ERC20_ABI, sig);
        const allowance = await contract.allowance(account, ROUTER_ADDRESS);
        if (allowance < valA) await (await contract.approve(ROUTER_ADDRESS, ethers.MaxUint256)).wait();
      }

      let tx;
      if (tab === 'swap') {
        const path = [tokenA.address, tokenB.address];
        tx = tokenA.isNative 
          ? await router.swapExactETHForTokens(0, path, account, deadline, { value: valA })
          : await router.swapExactTokensForETH(valA, 0, path, account, deadline);
      } else {
        const tokenAddr = tokenA.isNative ? tokenB.address : tokenA.address;
        const tAmt = tokenA.isNative ? valB : valA;
        const eAmt = tokenA.isNative ? valA : valB;
        tx = await router.addLiquidityETH(tokenAddr, tAmt, 0, 0, account, deadline, { value: eAmt });
      }
      await tx.wait();
      alert("Berhasil!");
    } catch (e) { alert("Gagal! Cek Pool/Saldo."); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050c0a] text-emerald-500 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-900/10 blur-[130px] rounded-full"></div>
      
      <div className="z-10 w-full max-w-[460px] space-y-6">
        {/* Header - Kembali ke "Decentralized" */}
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-emerald-500 rounded-xl flex items-center justify-center bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <span className="font-black text-xl text-emerald-400 font-mono italic">D</span>
            </div>
            <h1 className="text-xl font-black tracking-[0.15em] uppercase italic text-emerald-400">Decentralized</h1>
          </div>
          {account ? (
            <div className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">{account.slice(0,6)}...</div>
          ) : (
            <button onClick={connectWallet} className="bg-emerald-500 text-black px-4 py-2 rounded-full text-[10px] font-black">CONNECT</button>
          )}
        </div>

        {/* Card */}
        <div className="bg-[#0a1814]/90 backdrop-blur-2xl border border-emerald-500/20 rounded-[44px] p-6 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-black/40 p-1.5 rounded-[22px] border border-emerald-900/30 mb-8">
            <button onClick={() => setTab('swap')} className={`flex-1 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-[0.2em] transition-all ${tab === 'swap' ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-emerald-900'}`}>Swap</button>
            <button onClick={() => setTab('liquidity')} className={`flex-1 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-[0.2em] transition-all ${tab === 'liquidity' ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-emerald-900'}`}>Liquidity</button>
          </div>

          <div className="space-y-2 relative">
            <div className="bg-black/40 border border-emerald-500/10 p-6 rounded-[32px] hover:border-emerald-500/30 transition-all">
              <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest block mb-4">{tab === 'swap' ? 'You Pay' : 'Token 1'}</label>
              <div className="flex items-center gap-4">
                <input type="number" placeholder="0.0" value={amountA} onChange={(e) => setAmountA(e.target.value)} className="bg-transparent text-4xl font-bold text-emerald-500 w-full outline-none placeholder:text-emerald-950" />
                <select value={tokenA.address} onChange={(e) => setTokenA(tokens.find(t => t.address === e.target.value))} className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-2xl text-emerald-400 font-bold text-xs outline-none cursor-pointer hover:bg-emerald-500/20">
                  {tokens.map(t => <option key={t.address} value={t.address} className="bg-[#0a1814]">{t.symbol}</option>)}
                </select>
              </div>
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div onClick={() => {setTokenA(tokenB); setTokenB(tokenA)}} className="w-12 h-12 bg-[#050c0a] border-2 border-emerald-500 rounded-2xl flex items-center justify-center text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] rotate-45 hover:rotate-0 transition-all cursor-pointer group">
                <div className="-rotate-45 group-hover:rotate-0 transition-all">{tab === 'swap' ? <ArrowDown size={20} /> : <Plus size={20} />}</div>
              </div>
            </div>

            <div className="bg-black/40 border border-emerald-500/10 p-6 rounded-[32px] pt-12">
              <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest block mb-4">{tab === 'swap' ? 'You Receive' : 'Token 2'}</label>
              <div className="flex items-center gap-4">
                <input type={tab === 'swap' ? "text" : "number"} readOnly={tab === 'swap'} placeholder="0.0" value={amountB} onChange={(e) => setAmountB(e.target.value)} className="bg-transparent text-4xl font-bold text-emerald-100 w-full outline-none" />
                <select value={tokenB.address} onChange={(e) => setTokenB(tokens.find(t => t.address === e.target.value))} className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-2xl text-emerald-400 font-bold text-xs outline-none cursor-pointer hover:bg-emerald-500/20">
                  {tokens.map(t => <option key={t.address} value={t.address} className="bg-[#0a1814]">{t.symbol}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center">
            <span className="text-[9px] font-black text-emerald-900 uppercase tracking-[0.5em] mb-3 opacity-60">Secured Protocol</span>
            <button onClick={handleAction} disabled={!amountA || loading} className="w-full h-20 bg-emerald-500 hover:bg-emerald-400 text-black rounded-[28px] font-black text-xl tracking-[0.3em] transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              {loading ? <RefreshCw className="animate-spin mx-auto" /> : tab === 'swap' ? 'SWAP NOW' : 'ADD LIQUIDITY'}
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-6 opacity-30">
          <a href="https://twitter.com/maxi_dak" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors"><Twitter size={18} /></a>
          <a href="https://github.com/YFiN99" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors"><Github size={18} /></a>
        </div>
      </div>
    </div>
  );
}