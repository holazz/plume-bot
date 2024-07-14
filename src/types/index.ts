import type { Contract, providers } from 'ethers'

export interface WalletConfig {
  privateKey: string
  address: string
  label?: string
}

export interface Calls {
  contract: Contract
  functionName: string
  args: any[]
  options?: providers.TransactionRequest
}
