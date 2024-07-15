import fsp from 'node:fs/promises'
import { Contract, Wallet } from 'ethers'
import dayjs from '../utils/dayjs'
import { generateWalletTitle, getProvider } from '../utils'
import logger from '../utils/logger'
import { resolvedWallets } from '../configs/wallets'

const provider = getProvider()
const contract = new Contract('0x8Dc5b3f1CcC75604710d9F464e3C5D2dfCAb60d8', [
  {
    inputs: [],
    name: 'checkIn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
])

async function checkIn(privateKey: string) {
  const signer = new Wallet(privateKey, provider)
  logger.info(signer.address, '签到中...')
  return contract.connect(signer).checkIn()
}

export async function run() {
  for (let i = 0; i < resolvedWallets.length; i++) {
    const wallet = resolvedWallets[i]
    const signer = new Wallet(wallet.privateKey, provider)
    try {
      await checkIn(wallet.privateKey)
      logger.success(signer.address, '签到成功!')
      await fsp.appendFile(
        'check.txt',
        `${dayjs().format('YYYY-MM-DD HH:mm:ss')} ${generateWalletTitle(
          signer.address,
        )}\n`.replace(
          // eslint-disable-next-line no-control-regex
          /\x1B\[\d+m/g,
          '',
        ),
      )
    } catch (e: any) {
      logger.error(signer.address, e?.error?.reason || 'error')
    }
  }
}

run()
