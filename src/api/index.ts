import axios from 'axios'
import logger from '../utils/logger'
import type { Wallet } from 'ethers'

export async function getFaucetInfo(address: string, token: 'ETH' | 'GOON') {
  const res = await axios.post('https://faucet.plumenetwork.xyz/api/faucet', {
    token,
    walletAddress: address,
  })
  return res.data
}

export async function getETHPrice(): Promise<number> {
  const res = await axios.get('https://min-api.cryptocompare.com/data/price', {
    params: {
      fsym: 'ETH',
      tsyms: 'USD',
    },
  })
  return res.data.USD
}

export async function getLatestTransaction(address: string) {
  const res = await axios.get(
    `https://plume-testnet.explorer.caldera.xyz/api/v2/addresses/${address}/transactions?filter=from`,
    {
      params: {
        filter: 'from',
      },
    },
  )
  return res.data.items
}

export async function login(signer: Wallet, referralCode?: string) {
  const { data: nonce } = await axios.post(
    'https://points-api.plumenetwork.xyz/auth/nonce',
  )
  const date = new Date().toISOString()
  const message = `miles.plumenetwork.xyz wants you to sign in with your Ethereum account:\n${signer.address}\n\nPlease sign with your account\n\nURI: https://miles.plumenetwork.xyz\nVersion: 1\nChain ID: 161221135\nNonce: ${nonce}\nIssued At: ${date}`
  const signature = await signer.signMessage(message)
  const res = await axios.post(
    'https://points-api.plumenetwork.xyz/authentication',
    {
      message,
      signature,
      referrer: referralCode,
      strategy: 'web3',
    },
  )
  logger.success(signer.address, '登录成功!')
  return {
    address: signer.address,
    accessToken: res.data.accessToken,
    referralCode: res.data.user.referralCode.split('-')[1],
  }
}
