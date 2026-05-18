import { Address } from 'viem';

// Deployed on Mantle Sepolia testnet
// v2: Allows deletion of completed agents (0 balance)
export const AGENT_PAY_ADDRESS_SEPOLIA = "0x250a83CC3Db28e0819b263c8E086F2d0d92a3E9f" as const;
export const AGENT_PAY_DEPLOY_BLOCK_SEPOLIA = 33430581n;

// Mainnet Deployment
export const AGENT_PAY_ADDRESS_MAINNET = "0x5dB9f58162feE7d957DF9E2f9112b4BF5D2a20d3" as const;
export const AGENT_PAY_DEPLOY_BLOCK_MAINNET = 89887760n;

export const CONTRACT_CONFIG: Record<number, { address: Address; deployBlock: bigint }> = {
    5003: {
        address: AGENT_PAY_ADDRESS_SEPOLIA,
        deployBlock: AGENT_PAY_DEPLOY_BLOCK_SEPOLIA
    },
    5000: {
        address: AGENT_PAY_ADDRESS_MAINNET,
        deployBlock: AGENT_PAY_DEPLOY_BLOCK_MAINNET
    }
};



export const NATIVE_TOKEN = "0x0000000000000000000000000000000000000000";

export const SUPPORTED_TOKENS = [
    {
        symbol: "MNT",
        name: "Mantle Token",
        address: NATIVE_TOKEN,
        decimals: 18,
        logo: "https://cryptologos.cc/logos/mantle-mnt-logo.png",
        chainId: 0
    },
    {
        symbol: "USDT",
        name: "Tether USD",
        address: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e95605",
        decimals: 6,
        chainId: 5000,
        logo: "https://cryptologos.cc/logos/tether-usdt-logo.png"
    },
    {
        symbol: "USDC",
        name: "USD Coin",
        address: "0x09Bc4E0D864854c6aF34380934986d7095D55185",
        decimals: 6,
        chainId: 5000,
        logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
    },
    {
        symbol: "mETH",
        name: "Mantle Staked ETH",
        address: "0xd5f7838f5c461feff7fe49ea5ebaf7728bb0adfa",
        decimals: 18,
        chainId: 5000,
        logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png"
    },
    {
        symbol: "cmETH",
        name: "Mantle Restaked ETH",
        address: "0xe6829d9a7ee3040e1276fa75293bde931859e8fa",
        decimals: 18,
        chainId: 5000,
        logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png"
    },
    {
        symbol: "WETH",
        name: "Wrapped Ether",
        address: "0xdeaddeaddeaddeaddeaddeaddeaddeaddead1111",
        decimals: 18,
        chainId: 5000,
        logo: "https://cryptologos.cc/logos/weth-weth-logo.png"
    },
    {
        symbol: "TEST",
        name: "Test Token (Sepolia)",
        address: "0xdeadbeef00000000000000000000000000000000",
        decimals: 18,
        chainId: 5003,
        logo: ""
    }
] as const;

export const ERC20_ABI = [
    {
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" }
        ],
        name: "approve",
        outputs: [{ name: "", type: "bool" }],
        type: "function",
        stateMutability: "nonpayable"
    },
    {
        inputs: [{ name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        type: "function",
        stateMutability: "view"
    },
    {
        inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" }
        ],
        name: "allowance",
        outputs: [{ name: "", type: "uint256" }],
        type: "function",
        stateMutability: "view"
    }
] as const;

export const AGENT_PAY_ABI = [
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
            { indexed: false, internalType: "bool", name: "isActive", type: "bool" }
        ],
        name: "AgentStatusUpdated",
        type: "event"
    },
    {
        inputs: [
            { internalType: "uint256", name: "_id", type: "uint256" },
            { internalType: "bool", name: "_isActive", type: "bool" }
        ],
        name: "toggleAgentStatus",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    { inputs: [], stateMutability: "nonpayable", type: "constructor" },
    { inputs: [{ internalType: "address", name: "owner", type: "address" }], name: "OwnableInvalidOwner", type: "error" },
    { inputs: [{ internalType: "address", name: "account", type: "address" }], name: "OwnableUnauthorizedAccount", type: "error" },
    { inputs: [], name: "ReentrancyGuardReentrantCall", type: "error" },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "address", name: "user", type: "address" },
            { indexed: false, internalType: "bool", name: "isActive", type: "bool" },
            { indexed: false, internalType: "uint256", name: "limitPerTx", type: "uint256" }
        ],
        name: "AgentConfigured",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "tokenAmount", type: "uint256" }
        ],
        name: "AgentTopUp",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "tokenAmount", type: "uint256" }
        ],
        name: "AgentWithdrawn",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
            { indexed: true, internalType: "address", name: "creator", type: "address" },
            { indexed: true, internalType: "address", name: "recipient", type: "address" },
            { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "dueDate", type: "uint256" }
        ],
        name: "InvoiceCreated",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
            { indexed: true, internalType: "address", name: "payer", type: "address" },
            { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
        ],
        name: "InvoicePaid",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
            { indexed: true, internalType: "address", name: "creator", type: "address" }
        ],
        name: "InvoiceCancelled",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
            { indexed: true, internalType: "address", name: "newOwner", type: "address" }
        ],
        name: "OwnershipTransferred",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [{ indexed: true, internalType: "uint256", name: "id", type: "uint256" }],
        name: "ScheduledPaymentCancelled",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "interval", type: "uint256" }
        ],
        name: "ScheduledPaymentCreated",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
        ],
        name: "ScheduledPaymentExecuted",
        type: "event"
    },
    {
        inputs: [{ internalType: "address", name: "", type: "address" }],
        name: "agentConfigs",
        outputs: [
            { internalType: "bool", name: "isActive", type: "bool" },
            { internalType: "uint256", name: "limitPerTx", type: "uint256" },
            { internalType: "address", name: "allowedRecipient", type: "address" },
            { internalType: "uint256", name: "interval", type: "uint256" },
            { internalType: "uint256", name: "lastExecuted", type: "uint256" }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "_id", type: "uint256" }],
        name: "cancelScheduledPayment",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "_id", type: "uint256" }],
        name: "cancelInvoice",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            { internalType: "bool", name: "_isActive", type: "bool" },
            { internalType: "uint256", name: "_limitPerTx", type: "uint256" },
            { internalType: "address", name: "_allowedRecipient", type: "address" },
            { internalType: "uint256", name: "_interval", type: "uint256" }
        ],
        name: "configureAgent",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "_recipient", type: "address" },
            { internalType: "uint256", name: "_amount", type: "uint256" },
            { internalType: "address", name: "_token", type: "address" },
            { internalType: "string", name: "_metadataHash", type: "string" },
            { internalType: "uint256", name: "_dueDate", type: "uint256" }
        ],
        name: "createInvoice",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "_to", type: "address" },
            { internalType: "uint256", name: "_amount", type: "uint256" },
            { internalType: "address", name: "_token", type: "address" },
            { internalType: "uint256", name: "_interval", type: "uint256" },
            { internalType: "string", name: "_description", type: "string" },
            { internalType: "uint256", name: "_initialTokenDeposit", type: "uint256" },
            { internalType: "uint256", name: "_endDate", type: "uint256" }
        ],
        name: "createScheduledPayment",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [
            { internalType: "uint256", name: "_id", type: "uint256" },
            { internalType: "uint256", name: "_endDate", type: "uint256" }
        ],
        name: "updateScheduledPayment",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "endDate", type: "uint256" }
        ],
        name: "ScheduledPaymentUpdated",
        type: "event"
    },
    {
        inputs: [{ internalType: "uint256", name: "_id", type: "uint256" }],
        name: "executeScheduledPayment",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "_user", type: "address" }],
        name: "getAgentConfig",
        outputs: [
            {
                components: [
                    { internalType: "bool", name: "isActive", type: "bool" },
                    { internalType: "uint256", name: "limitPerTx", type: "uint256" },
                    { internalType: "address", name: "allowedRecipient", type: "address" },
                    { internalType: "uint256", name: "interval", type: "uint256" },
                    { internalType: "uint256", name: "lastExecuted", type: "uint256" }
                ],
                internalType: "struct AgentPay.AgentConfig",
                name: "",
                type: "tuple"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "_id", type: "uint256" }],
        name: "getInvoice",
        outputs: [
            {
                components: [
                    { internalType: "uint256", name: "id", type: "uint256" },
                    { internalType: "address", name: "creator", type: "address" },
                    { internalType: "address", name: "recipient", type: "address" },
                    { internalType: "uint256", name: "amount", type: "uint256" },
                    { internalType: "address", name: "token", type: "address" },
                    { internalType: "string", name: "metadataHash", type: "string" },
                    { internalType: "bool", name: "paid", type: "bool" },
                    { internalType: "uint256", name: "dueDate", type: "uint256" },
                    { internalType: "uint256", name: "createdAt", type: "uint256" }
                ],
                internalType: "struct AgentPay.Invoice",
                name: "",
                type: "tuple"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "getInvoiceCount",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "_id", type: "uint256" }],
        name: "getScheduledPayment",
        outputs: [
            {
                components: [
                    { internalType: "uint256", name: "id", type: "uint256" },
                    { internalType: "address", name: "from", type: "address" },
                    { internalType: "address", name: "to", type: "address" },
                    { internalType: "uint256", name: "amount", type: "uint256" },
                    { internalType: "address", name: "token", type: "address" },
                    { internalType: "uint256", name: "nextExecution", type: "uint256" },
                    { internalType: "uint256", name: "interval", type: "uint256" },
                    { internalType: "bool", name: "isActive", type: "bool" },
                    { internalType: "string", name: "description", type: "string" },
                    { internalType: "uint256", name: "balance", type: "uint256" },
                    { internalType: "uint256", name: "tokenBalance", type: "uint256" },
                    { internalType: "uint256", name: "endDate", type: "uint256" }
                ],
                internalType: "struct AgentPay.ScheduledPayment",
                name: "",
                type: "tuple"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "_user", type: "address" }],
        name: "getUserCreatedInvoices",
        outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "_user", type: "address" }],
        name: "getUserReceivedInvoices",
        outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "_user", type: "address" }],
        name: "getUserScheduledPayments",
        outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "_user", type: "address" }],
        name: "getUserStats",
        outputs: [
            { internalType: "uint256", name: "createdCount", type: "uint256" },
            { internalType: "uint256", name: "receivedCount", type: "uint256" },
            { internalType: "uint256", name: "totalPaid", type: "uint256" },
            { internalType: "uint256", name: "totalReceived", type: "uint256" },
            { internalType: "uint256", name: "scheduledCount", type: "uint256" }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "nextInvoiceId",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "nextScheduledPaymentId",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "owner",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "uint256", name: "_id", type: "uint256" }],
        name: "payInvoice",
        outputs: [],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "", type: "address" }],
        name: "totalPaidByUser",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "", type: "address" }],
        name: "totalReceivedByUser",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "uint256", name: "_id", type: "uint256" },
            { internalType: "uint256", name: "_tokenAmount", type: "uint256" }
        ],
        name: "topUpAgent",
        outputs: [],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    { stateMutability: "payable", type: "receive" }
] as const;

// Type definitions for frontend use
export interface Invoice {
    id: bigint;
    creator: `0x${string}`;
    recipient: `0x${string}`;
    amount: bigint;
    token: `0x${string}`;
    metadataHash: string;
    paid: boolean;
    dueDate: bigint;
    createdAt: bigint;
}

export interface ScheduledPayment {
    id: bigint;
    from: `0x${string}`;
    to: `0x${string}`;
    amount: bigint;
    token: `0x${string}`;
    nextExecution: bigint;
    interval: bigint;
    isActive: boolean;
    description: string;
    balance: bigint;
    tokenBalance: bigint;
    endDate: bigint;
}

export interface UserStats {
    createdCount: bigint;
    receivedCount: bigint;
    totalPaid: bigint;
    totalReceived: bigint;
    scheduledCount: bigint;
}
