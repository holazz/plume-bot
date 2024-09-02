import { Contract, Wallet } from 'ethers'
import pLimit from 'p-limit'
import { getProvider, retry } from '../utils'
import logger from '../utils/logger'
import { resolvedWallets } from '../configs/wallets'

const provider = getProvider()
const contract = new Contract('0xFED8e6fD3d616079558df4F6Adcda0a3C3c7245E', [
  {
    inputs: [],
    name: 'safeMint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
])

async function mintNFT(signer: Wallet) {
  const nonce = await signer.getTransactionCount()
  try {
    await contract.connect(signer).safeMint({
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
  const promises = resolvedWallets.map((wallet) => {
    return limit(() => {
      const signer = new Wallet(wallet.privateKey, provider)
      return retry(mintNFT, Number.MAX_SAFE_INTEGER)(signer)
    })
  })
  await Promise.all(promises)
}
