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
  const index = getRandomElementFromArray(
    Array.from({ length: 6 }, (_, i) => i),
  )
  const isLong = Math.random() > 0.5
  return {
    contract: new Contract('0x032139f44650481f4d6000c078820B8E734bF253', [
      {
        inputs: [
          {
            internalType: 'uint256',
            name: 'pairIndex',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'isLong',
            type: 'bool',
          },
        ],
        name: 'predictPriceMovement',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ]),
    functionName: 'predictPriceMovement',
    args: [index, isLong],
  }
}

export default {
  title: `${generateModuleTitle('Cultured')} 预测资产价格`,
  value: 'cultured',
  estimateGasFee: (signer: Wallet) => estimateGasFee(signer, getCalls()),
  sendTransaction: (signer: Wallet) => sendTransaction(signer, getCalls()),
}
