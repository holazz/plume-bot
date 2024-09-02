import 'dotenv/config'
import { Contract } from 'ethers'
import {
  estimateGasFee,
  generateModuleTitle,
  getRandomElementFromArray,
  sendTransaction,
} from '../utils'
import type { Wallet } from 'ethers'

function getCalls() {
  const projectId = getRandomElementFromArray(
    Array.from({ length: 33 }, (_, i) => i),
  )
  return {
    contract: new Contract('0xBd06BE7621be8F92101bF732773e539A4daF7e3f', [
      {
        type: 'function',
        name: 'vote',
        inputs: [
          {
            name: '_project',
            type: 'uint8',
            internalType: 'enum GovernanceStorage.Project',
          },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
    ]),
    functionName: 'vote',
    args: [projectId],
  }
}

export default {
  title: `${generateModuleTitle('Vote')} 生态系统投票`,
  value: 'vote',
  estimateGasFee: (signer: Wallet) => estimateGasFee(signer, getCalls()),
  sendTransaction: (signer: Wallet) => sendTransaction(signer, getCalls()),
}
