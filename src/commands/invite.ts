import 'dotenv/config'
import fsp from 'node:fs/promises'
import pLimit from 'p-limit'
import { Wallet } from 'ethers'
import logger from '../utils/logger'
import { eqAddress, generateWallets, getProvider, retry } from '../utils'
import { login } from '../api'
import { resolvedWallets } from '../configs/wallets'
import authData from '../../auth.json'

const provider = getProvider()

export async function run() {
  const limit = pLimit(10)
  for (let i = 0; i < resolvedWallets.length; i++) {
    const wallet = resolvedWallets[i]
    const referralCode = authData.find((item) =>
      eqAddress(item.address, wallet.address),
    )!.referralCode
    const [min, max] = JSON.parse(process.env.INVITE_RANGE!)
    const inviteCount = Math.floor(Math.random() * (max - min + 1) + min)
    const inviteWallets = generateWallets(inviteCount)
    logger.info(
      wallet.address,
      `邀请码: ${referralCode} 邀请人数: ${inviteCount}`,
    )
    const promises = inviteWallets.wallets.map((inviteWallet) => {
      return limit(() => {
        const signer = new Wallet(inviteWallet.privateKey, provider)
        return retry(login, Number.MAX_SAFE_INTEGER)(signer)
      })
    })
    await Promise.all(promises)
    await fsp.mkdir('data').catch(() => {})
    await fsp.writeFile(
      `data/${wallet.address}-${inviteCount}.json`,
      `${JSON.stringify(inviteWallets, null, 2)}\n`,
    )
  }
}
