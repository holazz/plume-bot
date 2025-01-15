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

export async function notify(signer: Wallet) {
  const timestamp = Math.round(Date.now() / 1e3)
  const dappAddress = 'pperu343eryaoxl6obev'
  const walletPublicKey = signer.address.toLowerCase()

  const message = `Sign in with Notifi 

    No password needed or gas is needed. 

    Clicking “Approve” only means you have proved this wallet is owned by you! 

    This request will not trigger any transaction or cost any gas fees. 

    Use of our website and service is subject to our terms of service and privacy policy. 
 
 'Nonce:' ${walletPublicKey}${dappAddress}${timestamp}`

  const signature = await signer.signMessage(message)
  const res = await axios.post('https://api.notifi.network/gql', {
    query:
      'mutation logInFromDapp($walletBlockchain: WalletBlockchain!, $walletPublicKey: String!, $dappAddress: String!, $timestamp: Long!, $signature: String!, $accountId: String) {\n  logInFromDapp(\n    dappLogInInput: {walletBlockchain: $walletBlockchain, walletPublicKey: $walletPublicKey, dappAddress: $dappAddress, timestamp: $timestamp, accountId: $accountId}\n    signature: $signature\n  ) {\n    ...UserFragment\n  }\n}\n\nfragment UserFragment on User {\n  email\n  emailConfirmed\n  authorization {\n    ...AuthorizationFragment\n  }\n  roles\n}\n\nfragment AuthorizationFragment on Authorization {\n  token\n  expiry\n}',
    variables: {
      walletBlockchain: 'AVALANCHE',
      walletPublicKey,
      dappAddress,
      timestamp,
      signature,
    },
    operationName: 'logInFromDapp',
  })
  logger.success(signer.address, '登录成功!')
  return res.data.data.logInFromDapp
}

export async function register(signer: Wallet) {
  const message = `By signing this message, I confirm that I have read and agreed to Plume's Airdrop Terms of Service. This does not cost any gas to sign.`
  const signature = await signer.signMessage(message)
  const res = await axios.post(
    'https://registration.plumenetwork.xyz/api/sign-write',
    {
      message,
      signature,
      address: signer.address,
      twitterEncryptedUsername: null,
      twitterEncryptedId: null,
      discordEncryptedUsername: null,
      discordEncryptedId: null,
    },
  )
  logger.success(signer.address, '注册成功!')
  return res.data
}
