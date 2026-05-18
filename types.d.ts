declare module "@oobe/sap-sdk" {
  export class SAPClient {
    constructor(config: { rpcUrl: string; agentId: string });
    registerAgent(args: { name: string; description: string; network: string }): Promise<any>;
    discoverTools(args: { query: string }): Promise<any>;
    callAgent(args: { agentId: string; task: string }): Promise<any>;
    listAgents(): Promise<any>;
    getScheduledPayments(): Promise<any>;
    toggleAgent(): Promise<any>;
    cancelAgent(): Promise<any>;
  }
}

declare module "@oobe/synapse-client-sdk" {
  export class SynapseClient {
    constructor(config: any);
  }
}

declare module "@acedatacloud/x402client" {
  export class X402Client {
    constructor(config: { rpcUrl: string; facilitator: string });
    pay(args: { url: string; amount: number; signerSecret: Uint8Array }): Promise<{ txSignature: string }>;
  }
}
