declare module "@oobe-protocol-labs/synapse-sap-sdk" {
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


