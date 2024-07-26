import fsp from 'node:fs/promises'
import axios from 'axios'
import pLimit from 'p-limit'
import { eqAddress, retry } from '../utils'
import logger from '../utils/logger'
import { resolvedWallets } from '../configs/wallets'

async function getNftInfo(address: string) {
  try {
    const res = await axios.get(
      `https://plume-testnet.explorer.caldera.xyz/api/v2/addresses/${address}/nft/collections?type=`,
    )
    if (res.data.items.length === 0) {
      return { address }
    }
    const collection = res.data.items.find((item: any) =>
      eqAddress(
        item.token.address,
        '0xb5F23eAe8B480131A346E45BE0923DBA905187AA',
      ),
    )
    if (!collection) {
      return { address }
    }
    const id = collection.token_instances[0].id
    const rarity = collection.token_instances[0].metadata.attributes[7].value
    const tier = collection.token_instances[0].metadata.attributes[8].value
    logger.info(address, `ID: ${id} Rarity: ${rarity} Tier: ${tier}`)
    return { address, id, rarity, tier }
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      return { address }
    }
    throw e
  }
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
