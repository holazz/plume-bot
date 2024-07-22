import 'dotenv/config'
import fsp from 'node:fs/promises'
import axios from 'axios'
import { Contract, Wallet } from 'ethers'
import pLimit from 'p-limit'
import dayjs from '../utils/dayjs'
import { eqAddress, generateWalletTitle, getProvider, retry } from '../utils'
import logger from '../utils/logger'
import { resolvedWallets } from '../configs/wallets'
import authData from '../../auth.json'
import nftData from '../../nft.json'

const provider = getProvider()
const contract = new Contract('0xb5F23eAe8B480131A346E45BE0923DBA905187AA', [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'callerConfirmation',
        type: 'address',
      },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_newtokenId',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: '_newtokenUri',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'burnTokenId',
        type: 'uint256',
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
    name: 'rerollNFT',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
])

export async function rerollNFT(signer: Wallet, burnTokenId: number) {
  const nonce = await signer.getTransactionCount()
  const accessToken = authData.find((item) =>
    eqAddress(item.address, signer.address),
  )!.accessToken
  try {
    const res = await axios.get(
      'https://points-api.plumenetwork.xyz/nft-minting',
      {
        params: {
          burnTokenId,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )
    const { tokenId, tokenUri, rarityTier, signature } = res.data.nft
    logger.info(signer.address, `Reroll NFT: ${tokenId} 中...`)
    await contract
      .connect(signer)
      .rerollNFT(tokenId, tokenUri, burnTokenId, signature, rarityTier, {
        nonce,
      })
    logger.success(signer.address, 'Reroll NFT 成功!')
    await fsp.appendFile(
      'nft.txt',
      `${dayjs().format('YYYY-MM-DD HH:mm:ss')} ${generateWalletTitle(
        signer.address,
      )} Reroll\n`.replace(
        // eslint-disable-next-line no-control-regex
        /\x1B\[\d+m/g,
        '',
      ),
    )
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
    (wallet) =>
      nftData.find((item) => eqAddress(item.address, wallet.address))?.rarity &&
      nftData.find((item) => eqAddress(item.address, wallet.address))!.rarity <
        Number(process.env.REROLL_RARITY),
  )
  const promises = filteredWallets.map((wallet) => {
    return limit(() => {
      const signer = new Wallet(wallet.privateKey, provider)
      const tokenId = nftData.find((item) =>
        eqAddress(item.address, wallet.address),
      )!.id
      return retry(rerollNFT, Number.MAX_SAFE_INTEGER)(signer, Number(tokenId))
    })
  })
  await Promise.all(promises)
}
