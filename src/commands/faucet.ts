import fsp from 'node:fs/promises'
import { Contract, Wallet } from 'ethers'
import dayjs from '../utils/dayjs'
import { generateWalletTitle, getProvider } from '../utils'
import logger from '../utils/logger'
import { getFaucetInfo } from '../api'
import { resolvedWallets } from '../configs/wallets'

const provider = getProvider()
const contract = new Contract('0x075e2D02EBcea5dbcE6b7C9F3D203613c0D5B33B', [
  {
    type: 'function',
    name: 'getToken',
    inputs: [
      {
        name: 'token',
        type: 'string',
        internalType: 'string',
      },
      {
        name: 'salt',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'signature',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
])

async function getToken(
  privateKey: string,
  token: 'ETH' | 'GOON',
  nonce: number,
) {
  const signer = new Wallet(privateKey, provider)
  const res = await getFaucetInfo(signer.address, token)
  const { salt, signature } = res
  logger.info(signer.address, `${token} 领取中...`)
  return contract.connect(signer).getToken(token, salt, signature, {
    nonce,
  })
}

export async function run() {
  // resolvedWallets.map(async (wallet) => {
  //   const signer = new Wallet(wallet.privateKey, provider)
  //   const nonce = await signer.getTransactionCount()
  //   try {
  //     const promises = [
  //       getToken(wallet.privateKey, 'ETH', nonce),
  //       getToken(wallet.privateKey, 'GOON', nonce + 1),
  //     ]
  //     await Promise.all(promises)
  //     logger.success(signer.address, '领取成功!')
  //   } catch (e: any) {
  //     logger.error(signer.address, e?.error?.reason || 'error')
  //   }
  // })
  let noGasAddresses: any = []
  try {
    noGasAddresses = (await fsp.readFile('gas.txt', 'utf-8'))
      .split('\n')
      .filter(Boolean)
  } catch {}
  const sortedWallets = [
    ...resolvedWallets.filter((wallet) =>
      noGasAddresses.includes(wallet.address),
    ),
    ...resolvedWallets.filter(
      (wallet) => !noGasAddresses.includes(wallet.address),
    ),
  ]
  for (let i = 0; i < sortedWallets.length; i++) {
    const wallet = sortedWallets[i]
    const signer = new Wallet(wallet.privateKey, provider)
    const nonce = await signer.getTransactionCount()
    try {
      const promises = [
        getToken(wallet.privateKey, 'ETH', nonce),
        getToken(wallet.privateKey, 'GOON', nonce + 1),
      ]
      await Promise.all(promises)
      logger.success(signer.address, '领取成功!')
      await fsp.appendFile(
        'faucet.txt',
        `${dayjs().format('YYYY-MM-DD HH:mm:ss')} ${generateWalletTitle(
          signer.address,
        )}\n`.replace(
          // eslint-disable-next-line no-control-regex
          /\x1B\[\d+m/g,
          '',
        ),
      )
    } catch (e: any) {
      logger.error(signer.address, e?.error?.reason || 'error')
    }
  }
}
