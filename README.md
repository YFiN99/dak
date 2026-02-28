# 🟢 DAK DEX - AI-Powered Decentralized Exchange

DAK DEX is a cutting-edge decentralized exchange (DEX) built on the **X1 Network**. It features an integrated **Gemini 3 Flash AI Agent** that acts as a "UI Navigator" and "Live Trading Assistant," bridging the gap between complex DeFi protocols and a seamless user experience.

**Live Site:** [dak-zeta.vercel.app](https://dak-zeta.vercel.app/)  
**Network:** X1 Network (Testnet/Mainnet)

---

## 🤖 Gemini AI Agent Integration (The "DAK Agent")
Our project participates in the **Live Agents** category. The DAK AI Agent is integrated directly into the frontend to simplify blockchain interactions:

* **Intelligent UI Navigation:** Users can type commands like *"Swap 0.1 X1T to Token 1"* and the AI will automatically populate the transaction forms.
* **Real-time Context Awareness:** The agent knows the user's wallet address, native balance, and current selected token to provide personalized advice.
* **Natural Language to Action:** Converts conversational intent into executable blockchain state changes, reducing the learning curve for new DeFi users.

## 🚀 Key Features
* **Instant Swap:** Exchange native X1T and ERC20 tokens with optimized routing.
* **Liquidity Provision:** Add liquidity to pools to support the ecosystem.
* **Yield Staking:** Stake "Token 1" to earn rewards with a real-time claiming mechanism.
* **One-Click Network Setup:** Integrated "Add X1 Network" button for seamless onboarding.

## 🛠️ Technical Architecture
- **Frontend:** React.js + Tailwind CSS (Cyberpunk Emerald Theme).
- **AI Engine:** Google Gemini 3 Flash API via REST integration.
- **Blockchain Interface:** Ethers.js (v6).
- **Smart Contracts:** Deployed on X1 Network (Router, WETH, Staking, and ERC20 tokens).

---

## 📦 Installation & Local Development

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/YFiN99/dak.git](https://github.com/YFiN99/dak.git)
    cd dak
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory:
    ```env
    VITE_GEMINI_API_KEY=your_google_gemini_api_key_here
    ```

4.  **Start Development Server:**
    ```bash
    npm run dev
    ```

---

## 🧪 Reproducible Testing Instructions (For Judges)

To verify the project's functionality, please follow these steps:

1.  **Connect Wallet:** Click the **CONNECT** button. If you aren't on X1 Network, the app will automatically prompt you to add/switch to **X1 Network** in MetaMask.
2.  **AI Command Test:** Locate the **DAK AI AGENT** chatbox at the bottom right.
3.  **Execute Intent:** Type: *"I want to swap 0.1 X1T"* and press Enter. 
    * *Observe:* The "You Pay" input field will automatically be filled with `0.1`.
4.  **Manual Transaction:** Perform a Swap or Stake action manually to verify the `ethers.js` integration with the X1 smart contracts.
5.  **Check Console:** You can see the AI's thought process and API responses in the browser's developer console.

## 🌐 X1 Network Details
- **Network Name:** X1 Network
- **Chain ID:** 196 (0xC4)
- **Currency Symbol:** X1T
- **Block Explorer:** [https://maculatus-scan.x1eco.com/](https://maculatus-scan.x1eco.com/)

---

## 🏗️ System Diagram (Architecture)
```text
[ User Interface (React) ] <------> [ Gemini 3 Flash API ]
           |                               |
           | (Ethers.js)                   | (NLP Processing)
           v                               v
[ X1 Network Smart Contracts ] <---- [ DAK AI Agent Logic ]