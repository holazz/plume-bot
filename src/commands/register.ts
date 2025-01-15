import { Wallet } from 'ethers'
import pLimit from 'p-limit'
import { getProvider, retry } from '../utils'
import { register } from '../api'
import { resolvedWallets } from '../configs/wallets'

const provider = getProvider()

export async function run() {
  const limit = pLimit(100)
  const promises = resolvedWallets.map((wallet) =>
    limit(() => {
      const signer = new Wallet(wallet.privateKey, provider)
      return retry(register, Number.MAX_SAFE_INTEGER)(signer)
    }),
  )
  const res = await Promise.all(promises)
  console.log(res)
}
