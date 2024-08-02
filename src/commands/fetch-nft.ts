import fsp from 'node:fs/promises'
import axios from 'axios'
import pLimit from 'p-limit'
import { Contract } from 'ethers'
import { eqAddress, getProvider, retry } from '../utils'
import logger from '../utils/logger'
import { resolvedWallets } from '../configs/wallets'

const provider = getProvider()
const contract = new Contract('0xb5F23eAe8B480131A346E45BE0923DBA905187AA', [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'tokenURI',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
])

async function getNftMetadata(id: Number) {
  const tokenURI = await contract.connect(provider).tokenURI(id)
  const res = await axios.get(tokenURI)
  return res.data
}

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
    let rarity = collection.token_instances[0]?.metadata?.attributes?.[7]?.value
    let tier = collection.token_instances[0]?.metadata?.attributes?.[8]?.value

    if (!collection.token_instances[0].metadata) {
      const metadata = await getNftMetadata(id)
      rarity = metadata.attributes[7].value
      tier = metadata.attributes[8].value
    }
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
