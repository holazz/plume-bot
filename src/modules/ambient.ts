import 'dotenv/config'
import { Contract, constants, utils } from 'ethers'
import tokens from '../constants/tokens'
import ABI from '../abi/ambient/abi.json'
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

const contractAddress = '0x4c722A53Cf9EB5373c655E1dD2dA95AcC10152D1'

async function getCalls(signer: Wallet, amountIn?: BigNumber) {
  if (!amountIn) {
    amountIn = (await signer.getBalance())
      .mul(Number(process.env.GOON_PERCENTAGE) * 100000)
      .div(100000)
  }
  return {
    contract: new Contract(contractAddress, ABI),
    functionName: 'swap',
    args: [
      tokens.goonUSD,
      tokens.GOON,
      36000,
      false,
      false,
      amountIn,
      0,
      65537,
      0,
      0,
    ],
  }
}

async function _sendTransaction(signer: Wallet) {
  const goonBalance = await getTokenBalance(signer, tokens.GOON, signer.address)
  if (goonBalance.lt(utils.parseEther('0.0001'))) {
    logger.error(signer.address, 'GOON 余额太少')
    return
  }
  const allowance = await getAllowance(signer, tokens.GOON, contractAddress)
  if (allowance.lt(goonBalance)) {
    logger.info(signer.address, `等待授权 GOON...`)
    const approveTx = await approveToken(
      signer,
      tokens.GOON,
      contractAddress,
      constants.MaxInt256,
    )
    logger.info(signer.address, `授权 GOON 完成 ${approveTx.hash}`)
  }
  const amountIn = goonBalance
    .mul(Number(process.env.GOON_PERCENTAGE) * 100000)
    .div(100000)

  const calls = await getCalls(signer, amountIn)
  return sendTransaction(signer, calls)
}

export default {
  title: `${generateModuleTitle('Ambient')} GOON 兑换成 goonUSD`,
  value: 'ambient',
  estimateGasFee: async (signer: Wallet) =>
    estimateGasFee(signer, await getCalls(signer)),
  sendTransaction: _sendTransaction,
}
