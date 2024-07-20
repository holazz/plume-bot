import axios from 'axios'
import { Contract, Wallet } from 'ethers'
import pLimit from 'p-limit'
import { getProvider, retry } from '../utils'
import logger from '../utils/logger'
import { resolvedWallets } from '../configs/wallets'
import authData from '../../auth.json'
import nftData from '../../nft.json'

const provider = getProvider()
const contract = new Contract('0xb5F23eAe8B480131A346E45BE0923DBA905187AA', [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_tokenId',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: '_tokenUri',
        type: 'string',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
      {
        internalType: 'uint8',
        name: 'tier',
        type: 'uint8',
      },
    ],
    name: 'mintNFT',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
])

async function mintNFT(signer: Wallet) {
  const nonce = await signer.getTransactionCount()
  const accessToken = authData.find(
    (item) => item.address === signer.address,
  )!.accessToken
  try {
    const res = await axios.get(
      'https://points-api.plumenetwork.xyz/nft-minting',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )
    const { tokenId, tokenUri, rarityTier, signature } = res.data.nft
    logger.info(signer.address, `Mint NFT: ${tokenId} 中...`)
    await contract
      .connect(signer)
      .mintNFT(tokenId, tokenUri, signature, rarityTier, {
        nonce,
      })
    logger.success(signer.address, 'Mint NFT 成功!')
  } catch (e: any) {
    logger.error(
      signer.address,
      e?.response?.data?.message ||
        e?.response?.data ||
        e?.error?.reason ||
        e?.cause ||
        e?.reason ||
        'error',
    )
  }
}

export async function run() {
  const limit = pLimit(100)
  const filteredWallets = resolvedWallets.filter(
    (wallet) => !nftData.find((item) => item.address === wallet.address)?.id,
  )
  const promises = filteredWallets.map((wallet) => {
    return limit(() => {
      const signer = new Wallet(wallet.privateKey, provider)
      return retry(mintNFT, Number.MAX_SAFE_INTEGER)(signer)
    })
  })
  await Promise.all(promises)
}
