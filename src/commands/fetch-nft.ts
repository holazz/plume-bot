import fsp from 'node:fs/promises'
import axios from 'axios'
import pLimit from 'p-limit'
import { retry } from '../utils'
import logger from '../utils/logger'
import { resolvedWallets } from '../configs/wallets'

async function getNftInfo(address: string) {
  const res = await axios.get(
    `https://plume-testnet.explorer.caldera.xyz/api/v2/addresses/${address}/nft/collections?type=`,
  )
  if (res.data.items.length === 0) {
    return { address }
  }
  const id = res.data.items[0].token_instances[0].id
  const rarity =
    res.data.items[0].token_instances[0].metadata.attributes[7].value
  const tier = res.data.items[0].token_instances[0].metadata.attributes[8].value
  logger.info(address, `ID: ${id} Rarity: ${rarity} Tier: ${tier}`)
  return { address, id, rarity, tier }
}

export async function run() {
  const limit = pLimit(100)
  const promises = resolvedWallets.map((wallet) =>
    limit(() => retry(getNftInfo, Number.MAX_SAFE_INTEGER)(wallet.address)),
  )
  const res = await Promise.all(promises)
  await fsp.writeFile('nft.json', `${JSON.stringify(res, null, 2)}\n`)
  return res
}
