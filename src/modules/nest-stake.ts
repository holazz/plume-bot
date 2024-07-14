import 'dotenv/config'
import { Contract, constants } from 'ethers'
import tokens from '../constants/tokens'
import ABI from '../abi/nest/abi.json'
import {
  approveToken,
  estimateGasFee,
  generateModuleTitle,
  getAllowance,
  getTokenBalance,
  sendTransaction,
} from '../utils'
import logger from '../utils/logger'
import type { BigNumber, Wallet } from 'ethers'

const contractAddress = '0xA34420e04DE6B34F8680EE87740B379103DC69f6'

async function getCalls(signer: Wallet, goonUSDBalance?: BigNumber) {
  if (!goonUSDBalance) {
    goonUSDBalance = (
      await getTokenBalance(signer, tokens.goonUSD, signer.address)
    )
      .mul(Number(process.env.GOONUSD_PERCENTAGE) * 10000)
      .div(10000)
  }
  return {
    contract: new Contract(contractAddress, ABI),
    functionName: 'stake',
    args: [goonUSDBalance],
  }
}

async function _sendTransaction(signer: Wallet) {
  const goonUSDBalance = (
    await getTokenBalance(signer, tokens.goonUSD, signer.address)
  )
    .mul(Number(process.env.GOONUSD_PERCENTAGE) * 10000)
    .div(10000)
  if (goonUSDBalance.isZero()) {
    logger.error(signer.address, 'goonUSD 余额不足')
    return
  }
  const allowance = await getAllowance(signer, tokens.goonUSD, contractAddress)
  if (allowance.lt(goonUSDBalance)) {
    logger.info(signer.address, `等待授权 goonUSD...`)
    const approveTx = await approveToken(
      signer,
      tokens.goonUSD,
      contractAddress,
      constants.MaxInt256,
    )
    logger.info(signer.address, `授权 goonUSD 完成 ${approveTx.hash}`)
  }
  const calls = await getCalls(signer, goonUSDBalance)
  return sendTransaction(signer, calls)
}

export default {
  title: `${generateModuleTitle('Nest')} 质押 goonUSD`,
  value: 'nestStake',
  estimateGasFee: async (signer: Wallet) =>
    estimateGasFee(signer, await getCalls(signer)),
  sendTransaction: _sendTransaction,
}
