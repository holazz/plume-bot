import 'dotenv/config'
import fsp from 'node:fs/promises'
import { Wallet } from 'ethers'
import axios from 'axios'
import logger from '../utils/logger'
import { generateWallets, getProvider, retry } from '../utils'
import { resolvedWallets } from '../configs/wallets'

const provider = getProvider()

async function getNonce() {
  const res = await axios.post('https://points-api.plumenetwork.xyz/auth/nonce')
  return res.data
}

export async function login(privateKey: string) {
  const nonce = await getNonce()
  const signer = new Wallet(privateKey, provider)
  const date = new Date().toISOString()
  const message = `miles.plumenetwork.xyz wants you to sign in with your Ethereum account:\n${signer.address}\n\nPlease sign with your account\n\nURI: https://miles.plumenetwork.xyz\nVersion: 1\nChain ID: 161221135\nNonce: ${nonce}\nIssued At: ${date}`
  const signature = await signer.signMessage(message)
  const res = await axios.post(
    'https://points-api.plumenetwork.xyz/authentication',
    {
      message,
      signature,
      referrer: process.env.REFERRER_CODE,
      strategy: 'web3',
    },
  )
  return res.data
}

async function run() {
  for (let i = 0; i < resolvedWallets.length; i++) {
    const wallet = resolvedWallets[i]
    const res = await retry(login, Number.MAX_SAFE_INTEGER)(wallet.privateKey)
    const referralCode = res.user.referralCode.split('-')[1]
    logger.info(wallet.address, `邀请码: ${referralCode}`)
    const inviteCount = Math.floor(Math.random() * (1000 - 500 + 1) + 500)
    const inviteWallets = generateWallets(inviteCount)
    for (const inviteWallet of inviteWallets.wallets) {
      const res = await retry(
        login,
        Number.MAX_SAFE_INTEGER,
      )(inviteWallet.privateKey)
      console.log(res.user.walletAddress)
    }
    await fsp.writeFile(
      `data/${wallet.address}-${inviteCount}.json`,
      JSON.stringify(inviteWallets.wallets, null, 2),
    )
    await fsp.appendFile(
      'invite.txt',
      `${wallet.address} ${referralCode} ${inviteCount}\n`,
    )
  }
}

run()
