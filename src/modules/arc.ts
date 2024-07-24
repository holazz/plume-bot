import 'dotenv/config'
import { Contract, utils } from 'ethers'
import {
  estimateGasFee,
  generageRandomName,
  generateModuleTitle,
  getRandomElementFromArray,
  sendTransaction,
} from '../utils'
import logger from '../utils/logger'
import type { Wallet } from 'ethers'

const productMap = {
  0: 'art',
  1: 'collectible-cards',
  2: 'farming',
  3: 'investment-alcohol',
  4: 'investment-cigars',
  5: 'investment-watch',
  6: 'rare-sneakers',
  7: 'real-estate',
  8: 'solar-energy',
  9: 'tokenized-gpus',
} as const

function getCalls() {
  const index: keyof typeof productMap = getRandomElementFromArray(
    Array.from({ length: 10 }, (_, i) => i),
  )
  const name = generageRandomName()
  const description = generageRandomName()
  const image = `https://miles.plumenetwork.xyz/images/arc/${productMap[index]}.webp`
  return {
    contract: new Contract('0x485D972889Ee8fd0512403E32eE94dE5c7a5DC7b', [
      {
        type: 'function',
        name: 'createToken',
        inputs: [
          { name: 'name', type: 'string', internalType: 'string' },
          { name: 'symbol', type: 'string', internalType: 'string' },
          { name: 'description', type: 'string', internalType: 'string' },
          { name: 'rwaType', type: 'uint256', internalType: 'uint256' },
          { name: 'image', type: 'string', internalType: 'string' },
        ],
        outputs: [{ name: '', type: 'address', internalType: 'address' }],
        stateMutability: 'nonpayable',
      },
    ]),
    functionName: 'createToken',
    args: [name, 'ITEM', description, index, image],
  }
}

async function _sendTransaction(signer: Wallet) {
  const balance = await signer.getBalance()
  if (balance.lt(utils.parseEther('0.1'))) {
    logger.error(signer.address, 'ETH 余额低于 0.1')
    return
  }
  return sendTransaction(signer, getCalls())
}

export default {
  title: `${generateModuleTitle('Arc')} 发布 RWAs 资产`,
  value: 'arc',
  estimateGasFee: (signer: Wallet) => estimateGasFee(signer, getCalls()),
  sendTransaction: _sendTransaction,
}
