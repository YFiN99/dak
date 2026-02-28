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

// KONFIGURASI NETWORK X1 (Agar Juri Gampang)
const X1_NETWORK_PARAMS = {
  chainId: '0xC4', // 196 in hex
  chainName: 'X1 Network',
  nativeCurrency: { name: 'X1T', symbol: 'X1T', decimals: 18 },
  rpcUrls: ['https://x1-testnet.infura.io/v3/YOUR_INFURA_KEY'], // Pastikan RPC ini aktif atau ganti ke publik RPC
  blockExplorerUrls: ['https://maculatus-scan.x1eco.com/']
};

// ABI (Tetap sama seperti kodemu)
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

  // FUNGSI OTOMATIS TAMBAH NETWORK X1
  const switchOrAddNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: X1_NETWORK_PARAMS.chainId }],
      });
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [X1_NETWORK_PARAMS],
          });
        } catch (addError) { console.error(addError); }
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) return toast.error("Please install MetaMask");
    try {
      await switchOrAddNetwork(); // Cek network dulu sebelum konek
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const prov = new ethers.BrowserProvider(window.ethereum);
      setAccount(accounts[0]);
      setProvider(prov);
      setRouter(new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, await prov.getSigner()));
      toast.success("Connected to X1 Network");
    } catch (err) {
      console.error(err);
      toast.error("Connection failed");
    }
  };

  // Logika Fetch (Balance, Staking, Price) tetap sama seperti kodemu...
  useEffect(() => { if (account && provider) { fetchBalances(); const i = setInterval(fetchBalances, 8000); return () => clearInterval(i); } }, [account, provider, tokenA, tokenB]);
  const fetchBalances = async () => { /* kodenya tetap sama */ };
  const fetchStakingData = async () => { /* kodenya tetap sama */ };

  // UI RENDER
  return (
    <div className="min-h-screen bg-[#050c0a] text-emerald-500 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-900/10 blur-[130px] rounded-full"></div>
      
      <div className="z-10 w-full max-w-[480px] space-y-6">
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-emerald-500 rounded-xl flex items-center justify-center bg-emerald-500/5">
              <span className="font-black text-xl text-emerald-400 font-mono italic">D</span>
            </div>
            <h1 className="text-xl font-black tracking-[0.15em] uppercase italic text-emerald-400">DAK DEX</h1>
          </div>
          
          <div className="flex gap-2">
            <button onClick={switchOrAddNetwork} className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 hover:bg-emerald-500/20 transition-all">
              <Globe size={14} />
            </button>
            {account ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-[10px] font-mono text-emerald-400 flex items-center gap-2">
                <Wallet size={12} /> {account.slice(0,6)}...{account.slice(-4)}
              </div>
            ) : (
              <button onClick={connectWallet} className="bg-emerald-500 text-black px-4 py-2 rounded-full text-[10px] font-black tracking-widest hover:bg-emerald-400">CONNECT</button>
            )}
          </div>
        </div>

        {/* BOX UTAMA (Swap/Stake) - Tetap pakai kodemu yang sudah bagus */}
        <div className="bg-[#0a1814]/90 backdrop-blur-2xl border border-emerald-500/20 rounded-[44px] p-6 shadow-2xl">
           {/* ... (isi tab dan input kodemu) ... */}
           {/* Saya asumsikan bagian ini tetap sama seperti kode yang kamu kirim tadi */}
           <div className="flex bg-black/40 p-1.5 rounded-[22px] border border-emerald-900/30 mb-8">
            {['swap', 'liquidity', 'stake'].map((t) => (
              <button key={t} onClick={() => {setTab(t); setAmountA(''); setAmountB('');}} className={`flex-1 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.15em] transition-all ${tab === t ? 'bg-emerald-500 text-black' : 'text-emerald-900'}`}>{t}</button>
            ))}
          </div>

          {/* Render content based on tab (Swap/Stake) sesuai kodemu... */}
          {/* Tambahkan button action yang panggil handleAction */}
          <button onClick={handleAction} disabled={(!amountA && tab !== 'stake') || loading} className="w-full mt-6 h-20 bg-emerald-500 hover:bg-emerald-400 text-black rounded-[28px] font-black text-xl tracking-[0.3em] transition-all">
            {loading ? <RefreshCw className="animate-spin mx-auto" /> : tab.toUpperCase()}
          </button>
        </div>

        {/* Footer info (Twitter/Github) */}
        <div className="flex justify-center gap-6 opacity-30 mt-4">
          <a href="https://twitter.com/maxi_dak" target="_blank" rel="noreferrer"><Twitter size={18} /></a>
          <a href="https://github.com/YFiN99" target="_blank" rel="noreferrer"><Github size={18} /></a>
        </div>
      </div>

      <Toaster position="bottom-center" />

      {/* DAK AI - Terintegrasi dengan State App */}
      <DakAI 
        account={account} 
        balanceA={balanceA} 
        symbolA={tokenA.symbol} 
        setAmountA={setAmountA} 
      />
    </div>
  );
}