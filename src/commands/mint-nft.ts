import fsp from 'node:fs/promises'
import axios from 'axios'
import { Contract, Wallet } from 'ethers'
import { getProvider } from '../utils'
import logger from '../utils/logger'
import { resolvedWallets } from '../configs/wallets'

const mintedAddresses = (await fsp.readFile('nft.txt', 'utf-8'))
  .split('\n')
  .filter(Boolean)
const filteredWallets = resolvedWallets.filter(
  (wallet) => !mintedAddresses.includes(wallet.address),
)

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

async function getNonce() {
  const res = await axios.post('https://points-api.plumenetwork.xyz/auth/nonce')
  return res.data
}

export async function mintNFT(privateKey: string) {
  const nonce = await getNonce()
  const signer = new Wallet(privateKey, provider)
  const date = new Date().toISOString()
  const message = `miles.plumenetwork.xyz wants you to sign in with your Ethereum account:\n${signer.address}\n\nPlease sign with your account\n\nURI: https://miles.plumenetwork.xyz\nVersion: 1\nChain ID: 161221135\nNonce: ${nonce}\nIssued At: ${date}`
  const signature = await signer.signMessage(message)
  logger.info(signer.address, '获取 accessToken 中...')
  const loginRes = await axios.post(
    'https://points-api.plumenetwork.xyz/authentication',
    {
      message,
      signature,
      referrer: process.env.REFERRER_CODE,
      strategy: 'web3',
    },
  )
  const { accessToken } = loginRes.data
  logger.info(signer.address, '获取 NFT 信息中...')
  const nftRes = await axios.get(
    'https://points-api.plumenetwork.xyz/nft-minting',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 5000,
    },
  )
  const { tokenId, tokenUri, rarityTier, signature: s } = nftRes.data.nft
  return contract.connect(signer).mintNFT(tokenId, tokenUri, s, rarityTier)
}

export async function run() {
  for (let i = 0; i < filteredWallets.length; i++) {
    const wallet = filteredWallets[i]
    const signer = new Wallet(wallet.privateKey, provider)
    try {
      await mintNFT(wallet.privateKey)
      logger.success(signer.address, 'Mint NFT 成功!')
      await fsp.appendFile('nft.txt', `${signer.address}\n`)
    } catch (e: any) {
      if (
        e?.response?.data?.message ===
        'User has already minted and no burnTokenId provided'
      ) {
        await fsp.appendFile('nft.txt', `${signer.address}\n`)
      }
      logger.error(
        signer.address,
        e?.response?.data?.message || e?.error?.reason || 'error',
      )
    }
  }
}

run()
