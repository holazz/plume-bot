import fsp from 'node:fs/promises'
import { Contract, Wallet } from 'ethers'
import pLimit from 'p-limit'
import dayjs from '../utils/dayjs'
import { generateWalletTitle, getProvider, retry } from '../utils'
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

async function checkIn(signer: Wallet) {
  const nonce = await signer.getTransactionCount()
  logger.info(signer.address, '签到中...')
  try {
    await contract.connect(signer).checkIn({
      nonce,
    })
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

export async function run() {
  const limit = pLimit(100)
  const promises = resolvedWallets.map((wallet) =>
    limit(async () => {
      const signer = new Wallet(wallet.privateKey, provider)
      await retry(checkIn, Number.MAX_SAFE_INTEGER)(signer)
    }),
  )
  await Promise.all(promises)
}
