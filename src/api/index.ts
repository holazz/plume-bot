import axios from 'axios'

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
