import fsp from 'node:fs/promises'
import { Wallet } from 'ethers'
import pLimit from 'p-limit'
import { getProvider, retry } from '../utils'
import { login } from '../api'
import { resolvedWallets } from '../configs/wallets'

const provider = getProvider()

async function run() {
  const limit = pLimit(100)
  const promises = resolvedWallets.map((wallet) =>
    limit(() => {
      const signer = new Wallet(wallet.privateKey, provider)
      return retry(login, Number.MAX_SAFE_INTEGER)(signer)
    }),
  )
  const res = await Promise.all(promises)
  await fsp.writeFile('auth.json', `${JSON.stringify(res, null, 2)}\n`)
}

run()
