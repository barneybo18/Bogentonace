<p align="center">
  <img src="public/bogent-banner.png" alt="BOGENT - Autonomous AI Payments on Mantle" width="100%">
</p>

<p align="center">
  <a href="https://www.mantle.xyz/"><img src="https://img.shields.io/badge/Network-Mantle-green" alt="Mantle Network"></a>
  <a href="#"><img src="https://img.shields.io/badge/License-MIT-blue" alt="License"></a>
  <a href="https://bogent.vercel.app"><img src="https://img.shields.io/badge/Status-Live-success" alt="Status"></a>
  <a href="https://sepolia.mantlescan.xyz/address/0x250a83CC3Db28e0819b263c8E086F2d0d92a3E9f"><img src="https://img.shields.io/badge/Contract-Sepolia-orange" alt="Sepolia Contract"></a>
</p>

# 🤖 BOGENT - Autonomous Payments on Mantle


**BOGENT** is a decentralized agentic payment platform built on the **Mantle Network**. It empowers users with AI-driven "agents" for autonomous payment handling, recurring scheduling, and seamless invoice management.

## 🚀 Key Features

- **🧾 Decentralized Invoicing**: Create, track, and pay on-chain invoices with full transparency.
- **🤖 Autonomous Agents**: Configure "agents" to handle recurring payments (payroll, subscriptions) automatically.
- **💰 Funded Agents**: Agents hold funds directly (MNT or ERC20 tokens) for trustless execution.
- **⚡ Multi-Token Support**: Native **$MNT**, **USDT**, **USDC**, **mETH**, **cmETH**, **WETH** - network-aware token selection.(coming on mainnet)
- **📊 Interactive Dashboard**: Click stat cards to drill down into payments received, pending invoices, and wallet details.
- **🔄 Pause/Resume**: Full control over your agents with one-click pause and resume.
- **✏️ Edit Paused Agents**: Update or delete agents even when they are paused or terminated.
- **⏱️ Scheduled Termination**: Set end dates for agents to auto-terminate at a specific time.
- **🔮 Transaction Simulation**: Pre-flight transaction checks for better error handling and UX.
- **🕸️ Testnet Ready**: Deployed on Mantle Sepolia testnet with full token support.
- **📱 Fully Responsive**: Mobile-first design that works beautifully on all screen sizes.
- **🔔 Transaction Feedback**: Real-time toast notifications and transaction modals with Mantlescan links.

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Blockchain | [Mantle Network](https://www.mantle.xyz/) |
| Framework | [Next.js 16](https://nextjs.org/) (App Router + Turbopack) |
| React | [React 19](https://react.dev/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/) |
| Web3 | [Wagmi 2](https://wagmi.sh/) + [RainbowKit 2](https://www.rainbowkit.com/) + [Viem 2](https://viem.sh/) |
| Smart Contracts | Solidity 0.8.27 + Hardhat |
| State Management | [TanStack Query](https://tanstack.com/query) |
| Animations | [Framer Motion](https://www.framer.com/motion/) + [Vanta.js](https://www.vantajs.com/) |

## 📜 Smart Contracts

> **Note**: Currently deployed on **Mantle Sepolia Testnet**.

| Network | Address | Explorer |
|---------|---------|----------|
| **Mantle Sepolia** | `0x250a83CC3Db28e0819b263c8E086F2d0d92a3E9f` | [View](https://sepolia.mantlescan.xyz/address/0x250a83CC3Db28e0819b263c8E086F2d0d92a3E9f) |

### Contract Features

The `AgentPay.sol` smart contract provides:

| Function | Description |
|----------|-------------|
| `createInvoice()` | Create on-chain invoices with metadata, due dates, and token type |
| `payInvoice()` | Pay invoices using native MNT or ERC20 tokens |
| `cancelInvoice()` | Cancel unpaid invoices (creator only) |
| `createScheduledPayment()` | Deploy autonomous payment agents with initial funding |
| `updateScheduledPayment()` | Update agent end dates (works on paused agents) |
| `executeScheduledPayment()` | Execute due payments (called by worker/keeper) |
| `cancelScheduledPayment()` | Terminate agent and refund remaining balance (works on paused agents) |
| `toggleAgentStatus()` | Pause or resume an agent |
| `topUpAgent()` | Add more funds to an active agent |

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/barneybo18/MantleAgenticPayment.git
   cd MantleAgenticPayment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment**
   Create a `.env` file in the root directory:
   ```env
   PRIVATE_KEY=your_wallet_private_key
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🤖 Running the Agent Worker

The worker script executes due payments automatically:

```bash
npx hardhat run scripts/worker.js --network mantleSepolia
```

## 🧪 Deployment

To deploy the smart contracts to testnet:

```bash
npx hardhat run scripts/deploy.js --network mantleSepolia
```


## 🔐 Security

- **Ownable**: Contract ownership for administrative control.
- **ReentrancyGuard**: Protected against reentrancy attacks.
- **Non-Custodial**: Users verify all transactions via their wallet.
- **Funded Agents**: Agents hold their own funds - no approvals needed at execution time.
- **Transaction Simulation**: Pre-flight checks prevent failed transactions and provide clear error messages.

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── (app)/              # Main application routes
│   │   ├── agents/         # Agent management (create, edit, view)
│   │   ├── invoices/       # Invoice management (create, pay, track)
│   │   └── dashboard/      # User dashboard with stats
│   └── page.tsx            # Landing page
├── components/             # React components (40+ components)
│   ├── ui/                 # Shadcn UI primitives
│   ├── AgentCard.tsx       # Agent display with actions
│   ├── EditAgentModal.tsx  # Agent editing modal
│   ├── InvoiceDetailModal.tsx # Invoice details and payment
│   └── ...
├── contracts/              # Solidity smart contracts
│   └── AgentPay.sol        # Main contract (373 lines)
├── hooks/                  # Custom React hooks (16 hooks)
│   ├── useAgents.ts        # Fetch user agents
│   ├── useCreateAgent.ts   # Create new agents
│   ├── useUpdateAgent.ts   # Update agent with simulation
│   ├── useDeleteAgent.ts   # Delete agent with simulation
│   └── ...
├── lib/                    # Utilities and contract config
│   └── contracts.ts        # Contract addresses and ABIs
└── scripts/                # Deployment and automation scripts
    ├── deploy.js           # Contract deployment
    └── worker.js           # Payment execution worker
```

## 🎯 Use Cases

- **💼 Payroll Automation**: Pay contractors/employees on a weekly or monthly basis
- **📺 Subscriptions**: Decentralized subscription billing for Web3 services
- **🏠 Rent Payments**: Automated monthly rent in crypto
- **💸 DCA (Dollar-Cost Averaging)**: Automated recurring investments
- **🤝 Revenue Sharing**: Auto-distribute earnings to stakeholders

## 🚧 Recent Updates

- ✅ **Paused Agent Operations**: Edit and delete agents even when paused or terminated
- ✅ **Transaction Simulation**: Pre-flight checks for all agent operations
- ✅ **End Date Validation**: Smart minimum end dates based on payment interval
- ✅ **Improved Error Handling**: Detailed error messages with simulation feedback
- ✅ **UI Enhancements**: Better loading states and transaction feedback

---

Built with ❤️ for the **Mantle Hackathon**.
