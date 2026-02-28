import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ArrowDown, RefreshCw, Plus, Twitter, Github, Wallet, Coins, Globe } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import DakAI from './DakAI';

// KONFIGURASI ALAMAT KONTRAK
const ROUTER_ADDRESS = "0xB0aA1d29339bdFaC68a791d4C13b0698A239D97C";
const WETH_ADDRESS = "0xc2F331332ca914685D773781744b1C589861C9Aa"; 
const STAKING_ADDRESS = "0xe10D7578286782ED8a5999AA5686aD3013B23926";
const TOKEN_1_ADDRESS = "0xB1a79747Bf26595B913ddc6580614077C7634aAb";

const X1_NETWORK_PARAMS = {
  chainId: '0xC4',
  chainName: 'X1 Network',
  nativeCurrency: { name: 'X1T', symbol: 'X1T', decimals: 18 },
  rpcUrls: ['https://x1-testnet.infura.io/v3/YOUR_INFURA_KEY'], 
  blockExplorerUrls: ['https://maculatus-scan.x1eco.com/']
};

const ROUTER_ABI = ["function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)", "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)", "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)", "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)"];
const STAKING_ABI = ["function stake(uint256 amount) external", "function withdraw(uint256 amount) external", "function claimReward() external", "function earned(address account) public view returns (uint256)", "function balanceOf(address account) public view returns (uint256)", "function exit() external"];
const ERC20_ABI = ["function approve(address spender, uint256 amount) external returns (bool)", "function allowance(address owner, address spender) view returns (uint256)", "function balanceOf(address account) view returns (uint256)"];

export default function App() {
  const [tab, setTab] = useState('swap');
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [stakedBalance, setStakedBalance] = useState('0');
  const [pendingReward, setPendingReward] = useState('0');
  const [balanceA, setBalanceA] = useState('0'); 
  const [balanceB, setBalanceB] = useState('0'); 
  const [provider, setProvider] = useState(null);
  const [router, setRouter] = useState(null);

  const tokens = [
    { name: "X1T (Native)", symbol: "X1T", address: WETH_ADDRESS, isNative: true },
    { name: "Token 1", symbol: "1", address: TOKEN_1_ADDRESS, isNative: false },
    { name: "TKA", symbol: "TKA", address: "0x6cF0576a5088ECE1cbc92cbDdD2496c8de5517FB", isNative: false },
    { name: "TKB", symbol: "TKB", address: "0x2C71ab7D51251BADaE2729E3F842c43fc6BB68c5", isNative: false }
  ];

  const [tokenA, setTokenA] = useState(tokens[0]);
  const [tokenB, setTokenB] = useState(tokens[1]);

  const switchOrAddNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: X1_NETWORK_PARAMS.chainId }] });
    } catch (error) {
      if (error.code === 4902) {
        try { await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [X1_NETWORK_PARAMS] }); } catch (e) { console.error(e); }
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) return toast.error("Install MetaMask");
    try {
      await switchOrAddNetwork();
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const prov = new ethers.BrowserProvider(window.ethereum);
      setAccount(accounts[0]);
      setProvider(prov);
      setRouter(new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, await prov.getSigner()));
    } catch (err) { toast.error("Failed to connect"); }
  };

  const fetchBalances = async () => {
    if (!account || !provider) return;
    try {
      const getBal = async (t) => {
        if (t.isNative) return ethers.formatEther(await provider.getBalance(account));
        return ethers.formatEther(await new ethers.Contract(t.address, ERC20_ABI, provider).balanceOf(account));
      };
      setBalanceA(await getBal(tokenA));
      setBalanceB(await getBal(tokenB));
    } catch (e) { console.error(e); }
  };

  const fetchStakingData = async () => {
    if (!account || !provider || tab !== 'stake') return;
    try {
      const contract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, provider);
      setStakedBalance(ethers.formatEther(await contract.balanceOf(account)));
      setPendingReward(ethers.formatEther(await contract.earned(account)));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (account && provider) {
      fetchBalances(); fetchStakingData();
      const i = setInterval(() => { fetchBalances(); fetchStakingData(); }, 8000);
      return () => clearInterval(i);
    }
  }, [account, provider, tokenA, tokenB, tab]);

  useEffect(() => {
    const getPrice = async () => {
      if (!amountA || !router || tab !== 'swap' || tokenA.address === tokenB.address) return setAmountB('');
      try {
        const amounts = await router.getAmountsOut(ethers.parseEther(amountA), [tokenA.address, tokenB.address]);
        setAmountB(ethers.formatEther(amounts[1]));
      } catch (e) { setAmountB("No Pool"); }
    };
    getPrice();
  }, [amountA, tokenA, tokenB, router, tab]);

  const handleAction = async () => {
    if (!account) return connectWallet();
    setLoading(true);
    try {
      const sig = await provider.getSigner();
      const valA = ethers.parseEther(amountA || "0");
      const deadline = Math.floor(Date.now() / 1000) + 1200;

      if (tab === 'stake') {
        const token = new ethers.Contract(TOKEN_1_ADDRESS, ERC20_ABI, sig);
        if ((await token.allowance(account, STAKING_ADDRESS)) < valA) await (await token.approve(STAKING_ADDRESS, ethers.MaxUint256)).wait();
        await (await new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, sig).stake(valA)).wait();
      } else {
        if (!tokenA.isNative) {
          const tA = new ethers.Contract(tokenA.address, ERC20_ABI, sig);
          if ((await tA.allowance(account, ROUTER_ADDRESS)) < valA) await (await tA.approve(ROUTER_ADDRESS, ethers.MaxUint256)).wait();
        }
        const path = [tokenA.address, tokenB.address];
        if (tab === 'swap') {
          tokenA.isNative ? await (await router.swapExactETHForTokens(0, path, account, deadline, { value: valA })).wait() : await (await router.swapExactTokensForETH(valA, 0, path, account, deadline)).wait();
        } else {
          const valB = ethers.parseEther(amountB || "0");
          await (await router.addLiquidityETH(tokenA.isNative ? tokenB.address : tokenA.address, tokenA.isNative ? valB : valA, 0, 0, account, deadline, { value: tokenA.isNative ? valA : valB })).wait();
        }
      }
      toast.success('Success ✓'); setAmountA('');
    } catch (e) { toast.error('Failed'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050c0a] text-emerald-500 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-900/10 blur-[130px] rounded-full"></div>
      <div className="z-10 w-full max-w-[480px] space-y-6">
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-emerald-500 rounded-xl flex items-center justify-center bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <span className="font-black text-xl text-emerald-400 font-mono italic">D</span>
            </div>
            <h1 className="text-xl font-black tracking-[0.15em] uppercase italic text-emerald-400">DAK DEX</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={switchOrAddNetwork} className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 hover:bg-emerald-500/20 transition-all"><Globe size={14} /></button>
            {account ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-[10px] font-mono text-emerald-400 flex items-center gap-2"><Wallet size={12} /> {account.slice(0,6)}...{account.slice(-4)}</div>
            ) : (
              <button onClick={connectWallet} className="bg-emerald-500 text-black px-4 py-2 rounded-full text-[10px] font-black tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">CONNECT</button>
            )}
          </div>
        </div>

        <div className="bg-[#0a1814]/90 backdrop-blur-2xl border border-emerald-500/20 rounded-[44px] p-6 shadow-2xl">
          <div className="flex bg-black/40 p-1.5 rounded-[22px] border border-emerald-900/30 mb-8">
            {['swap', 'liquidity', 'stake'].map((t) => (
              <button key={t} onClick={() => {setTab(t); setAmountA(''); setAmountB('');}} className={`flex-1 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.15em] transition-all ${tab === t ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-emerald-900 hover:text-emerald-700'}`}>{t}</button>
            ))}
          </div>

          {tab === 'stake' ? (
            <div className="space-y-4">
              <div className="bg-black/40 border border-emerald-500/10 p-6 rounded-[32px]">
                <div className="flex justify-between mb-4">
                  <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Stake Token 1</label>
                  <span className="text-[10px] font-bold text-emerald-400/50">Staked: {parseFloat(stakedBalance).toFixed(4)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <input type="number" placeholder="0.0" value={amountA} onChange={(e) => setAmountA(e.target.value)} className="bg-transparent text-4xl font-bold text-emerald-500 w-full outline-none" />
                  <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl text-emerald-400 font-bold text-xs">TOKEN 1</div>
                </div>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-[28px] flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-emerald-900 uppercase">Rewards</p>
                  <p className="text-xl font-bold text-emerald-100">{parseFloat(pendingReward).toFixed(6)}</p>
                </div>
                <button onClick={() => {/* claim func */}} className="bg-emerald-500/20 text-emerald-400 px-5 py-2.5 rounded-xl text-[10px] font-black">CLAIM</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 relative">
              <div className="bg-black/40 border border-emerald-500/10 p-6 rounded-[32px]">
                <div className="flex justify-between mb-4">
                  <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">You Pay</label>
                  <span className="text-[10px] font-bold text-emerald-400/50">Bal: {parseFloat(balanceA).toFixed(4)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <input type="number" placeholder="0.0" value={amountA} onChange={(e) => setAmountA(e.target.value)} className="bg-transparent text-4xl font-bold text-emerald-500 w-full outline-none" />
                  <select value={tokenA.address} onChange={(e) => setTokenA(tokens.find(t => t.address === e.target.value))} className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-2xl text-emerald-400 text-xs font-bold outline-none">
                    {tokens.map(t => <option key={t.address} value={t.address} className="bg-[#0a1814]">{t.symbol}</option>)}
                  </select>
                </div>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div onClick={() => {const t = tokenA; setTokenA(tokenB); setTokenB(t);}} className="w-10 h-10 bg-[#050c0a] border border-emerald-500 rounded-xl flex items-center justify-center text-emerald-500 cursor-pointer hover:scale-110 transition-all">
                  {tab === 'swap' ? <ArrowDown size={18} /> : <Plus size={18} />}
                </div>
              </div>
              <div className="bg-black/40 border border-emerald-500/10 p-6 rounded-[32px] pt-10">
                <div className="flex justify-between mb-4">
                  <label className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">You Receive</label>
                  <span className="text-[10px] font-bold text-emerald-400/50">Bal: {parseFloat(balanceB).toFixed(4)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <input type="text" readOnly placeholder="0.0" value={amountB} className="bg-transparent text-4xl font-bold text-emerald-100 w-full outline-none" />
                  <select value={tokenB.address} onChange={(e) => setTokenB(tokens.find(t => t.address === e.target.value))} className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-2xl text-emerald-400 text-xs font-bold outline-none">
                    {tokens.map(t => <option key={t.address} value={t.address} className="bg-[#0a1814]">{t.symbol}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
          <button onClick={handleAction} disabled={loading || (!amountA && tab !== 'stake')} className="w-full mt-8 h-20 bg-emerald-500 hover:bg-emerald-400 text-black rounded-[28px] font-black text-xl tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50">
            {loading ? <RefreshCw className="animate-spin mx-auto" /> : tab.toUpperCase()}
          </button>
        </div>

        <div className="flex justify-center gap-6 opacity-30 mt-4">
          <a href="https://twitter.com/maxi_dak" target="_blank" rel="noreferrer"><Twitter size={18} /></a>
          <a href="https://github.com/YFiN99" target="_blank" rel="noreferrer"><Github size={18} /></a>
        </div>
      </div>

      <Toaster position="bottom-center" />
      <DakAI account={account} balanceA={balanceA} symbolA={tokenA.symbol} setAmountA={setAmountA} />
    </div>
  );
}