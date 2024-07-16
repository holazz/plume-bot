import fs from 'node:fs'
import fsp from 'node:fs/promises'
import c from 'picocolors'
import prompts from 'prompts'
import { uniqBy } from 'lodash-es'
import { Wallet } from 'ethers'
import { csv2json, json2csv } from 'json-2-csv'
import {
  generateWalletTitle,
  getLatestTransactionAge,
  getProvider,
} from '../utils'
import { resolvedWallets } from '../configs/wallets'
import modules from '../modules'
import dayjs from '../utils/dayjs'
import type { WalletConfig } from '../types'

interface Data extends WalletConfig {
  total: number
  [key: string]: any
}

async function generateData() {
  let records: Data[] = []
  if (fs.existsSync('records.csv')) {
    const csv = await fsp.readFile('records.csv', 'utf-8')
    records = (await csv2json(csv)) as Data[]
  }
  const data = resolvedWallets.map((wallet) => {
    const projects = modules.reduce(
      (acc, cur) => {
        return {
          ...acc,
          [cur.value]:
            records.find((d) => d.address === wallet.address)?.[cur.value] || 0,
        }
      },
      {} as Record<string, number>,
    )
    return {
      ...wallet,
      ...projects,
      total: Object.values(projects).reduce((acc, cur) => acc + cur, 0),
    }
  })
  return data
}

function processData(data: Data) {
  const getRandomEdge = (type: 'max' | 'min') => {
    const count = Math[type](...modules.map((s) => data[s.value]))
    const filteredSource = modules.filter((s) => data[s.value] === count)
    return filteredSource[Math.floor(Math.random() * filteredSource.length)]
  }
  const [max, min] = [getRandomEdge('max'), getRandomEdge('min')]
  const filteredModules = uniqBy(
    [
      ...modules.filter((m) => m.value === min.value),
      ...modules.filter((m) => m.value !== max.value),
    ],
    'value',
  )
  const randomModule = filteredModules.sort(() => Math.random() - 0.5)[0]
  return [data, randomModule.value] as [Data, string]
}

async function filterData(data: Data[]) {
  let filteredData: Data[] = []

  if (data.length - 2 < Number(process.env.ACCOUNT)) {
    filteredData = data
      .sort(() => Math.random() - 0.5)
      .slice(0, Number(process.env.ACCOUNT))
  } else {
    const getRandomEdge = (type: 'max' | 'min') => {
      const count = Math[type](...data.map((d) => d.total))
      const filteredSource = data.filter((d) => d.total === count)
      return filteredSource[Math.floor(Math.random() * filteredSource.length)]
    }

    const [max, min] = [getRandomEdge('max'), getRandomEdge('min')]
    filteredData = uniqBy(
      [
        ...data.filter((d) => d.address === min.address),
        ...data.filter((d) => d.address !== max.address),
      ],
      'address',
    )
      .sort(() => Math.random() - 0.5)
      .slice(0, Number(process.env.ACCOUNT))
  }

  return filteredData.map((wallet) => processData(wallet))
}

async function beforeSubmitTransaction(filteredData: [Data, string][]) {
  const promises = filteredData.map(async ([data, project]) => {
    const provider = getProvider()
    const signer = new Wallet(data.privateKey, provider)
    const module = modules.find((m) => m.value === project)!
    const age = await getLatestTransactionAge(data.address)

    return {
      address: data.address,
      project,
      age,
      sendTransaction: () => module.sendTransaction(signer),
    }
  })
  const res = await Promise.all(promises)
  let message = ''
  res.forEach((r) => {
    message += `\n${c.bold(generateWalletTitle(r.address))} ${c.dim(
      '›',
    )} ${c.bold(modules.find((m) => m.value === r.project)!.title)} ${r.age}`
  })

  if (process.env.TRANSACTION_CONFIRM === 'true') {
    const { value } = await prompts({
      type: 'confirm',
      name: 'value',
      message: `${message}, 确认交易吗?`,
      initial: true,
    })
    return {
      submitInfo: res,
      isSubmit: value,
    }
  }
  console.log(message)
  return {
    submitInfo: res,
    isSubmit: true,
  }
}

function updateRecords(data: Data[], filteredData: [Data, string][]) {
  const records = data.map((d) => {
    const filtered = filteredData.find((f) => f[0].address === d.address)!
    if (!filtered) return d
    return {
      ...d,
      [filtered[1]]: d[filtered[1]] + 1,
      total: d.total + 1,
    }
  })
  return records
}

export async function run() {
  const data = await generateData()
  const filteredData = await filterData(data)
  const { submitInfo, isSubmit } = await beforeSubmitTransaction(filteredData)
  if (!isSubmit) return

  const promises = submitInfo.map((info) => info.sendTransaction())
  const res = (await Promise.all(promises)).filter(Boolean)

  if (res.length === 0) return await run()

  res.flat().map(async (r) => {
    console.log(
      `\n${c.bold(generateWalletTitle(r!.address))}\n${c.bold('Transaction: ')}${c.green(
        `https://testnet-explorer.plumenetwork.xyz/tx/${r!.tx}`,
      )}\n`,
    )
    await fsp.appendFile(
      'log.txt',
      `${dayjs().format('YYYY-MM-DD HH:mm:ss')} ${generateWalletTitle(
        r!.address,
      )} ${
        modules.find(
          (m) =>
            m.value ===
            submitInfo.find((s) => s.address === r!.address)!.project,
        )!.title
      } ${`https://testnet-explorer.plumenetwork.xyz/tx/${r!.tx}`}\n`.replace(
        // eslint-disable-next-line no-control-regex
        /\x1B\[\d+m/g,
        '',
      ),
    )
  })

  const validIndexes = res
    .flat()
    .map((r) => filteredData.findIndex(([f]) => f.address === r!.address))
  const records = updateRecords(
    data,
    filteredData.filter((_, i) => validIndexes.includes(i)),
  )
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const csv = await json2csv(records.map(({ privateKey, ...rest }) => rest))
  await fsp.writeFile('records.csv', csv)
}
