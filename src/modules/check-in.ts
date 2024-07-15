import 'dotenv/config'
import { Contract } from 'ethers'
import { estimateGasFee, generateModuleTitle, sendTransaction } from '../utils'
import type { Wallet } from 'ethers'

function getCalls() {
  return {
    contract: new Contract('0x8Dc5b3f1CcC75604710d9F464e3C5D2dfCAb60d8', [
      {
        inputs: [],
        name: 'checkIn',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ]),
    functionName: 'checkIn',
    args: [],
  }
}

export default {
  title: `${generateModuleTitle('Plume')} 签到`,
  value: 'checkIn',
  estimateGasFee: (signer: Wallet) => estimateGasFee(signer, getCalls()),
  sendTransaction: (signer: Wallet) => sendTransaction(signer, getCalls()),
}
