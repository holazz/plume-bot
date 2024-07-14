import c from 'picocolors'
import prompts from 'prompts'
import { Wallet } from 'ethers'
import {
  generateWalletTitle,
  getLatestTransactionAge,
  getProvider,
} from '../utils'
import { resolvedWallets } from '../configs/wallets'
import modules from '../modules'
import type { providers } from 'ethers'
import type { WalletConfig } from '../types'

async function getConfig() {
  const input = process.argv.slice(2)

  let wallets = resolvedWallets.filter((w) =>
    input[0]?.split(',').includes(w.address),
  )

  if (wallets.length) {
    console.log(
      `${c.green('✔')} ${c.bold('请选择交互交互的钱包')} ${c.dim(
        '›',
      )} ${c.bold(
        wallets.map((w) => generateWalletTitle(w.address)).join(', '),
      )}`,
    )
  } else {
    const choices = await Promise.all(
      resolvedWallets.map(async (wallet) => {
        const age = await getLatestTransactionAge(wallet.address)
        return {
          title: `${generateWalletTitle(wallet.address)} ${age}`,
          value: wallet,
        }
      }),
    )
    const { wallets: w } = await prompts({
      type: 'multiselect',
      name: 'wallets',
      message: '请选择交互的钱包',
      choices,
      instructions: false,
    })
    wallets = w
  }

  let project = modules.find((m) => m.value === input[1])?.value

  if (project) {
    console.log(
      `${c.green('✔')} ${c.bold('请选择交互的项目')} ${c.dim('›')} ${c.bold(
        modules.find((m) => m.value === input[1])?.title,
      )}`,
    )
  } else {
    const { project: p } = await prompts({
      type: 'select',
      name: 'project',
      message: '请选择交互的项目',
      choices: modules,
    })
    project = p
  }

  return { wallets, project }
}

async function beforeSubmitTransaction(
  provider: providers.JsonRpcProvider,
  wallet: WalletConfig,
  module: (typeof modules)[0],
) {
  if (process.env.TRANSACTION_CONFIRM === 'true') {
    const signer = new Wallet(wallet.privateKey, provider)
    const fee = await module.estimateGasFee(signer)
    const { value } = await prompts({
      type: 'confirm',
      name: 'value',
      message: `预估手续费: ${c.yellow(`$${fee}`)}, 确认交易吗?`,
      initial: true,
    })
    return value
  }
  return true
}

export async function run() {
  const { wallets, project } = await getConfig()
  const module = modules.find((m) => m.value === project)!

  const provider = getProvider()
  const isSubmit = await beforeSubmitTransaction(provider, wallets[0], module)

  if (!isSubmit) return

  const promises = wallets.map(async (wallet) => {
    const signer = new Wallet(wallet.privateKey, provider)
    return module.sendTransaction(signer)
  })

  const res = await Promise.all(promises)

  res
    .flat()
    .filter(Boolean)
    .forEach((r) => {
      console.log(
        `\n${c.bold(generateWalletTitle(r!.address))}\n${c.bold(
          'Nonce: ',
        )}${c.yellow(r!.nonce.toString())}\n${c.bold('Transaction: ')}${c.green(
          `https://testnet-explorer.plumenetwork.xyz/tx/${r!.tx}`,
        )}\n`,
      )
    })
}
