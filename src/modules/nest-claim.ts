import 'dotenv/config'
import { Contract } from 'ethers'
import ABI from '../abi/nest/abi.json'
import { estimateGasFee, generateModuleTitle, sendTransaction } from '../utils'
import type { Wallet } from 'ethers'

const contractAddress = '0xA34420e04DE6B34F8680EE87740B379103DC69f6'

function getCalls() {
  return {
    contract: new Contract(contractAddress, ABI),
    functionName: 'claim',
    args: [],
  }
}

export default {
  title: `${generateModuleTitle('Nest')} 领取质押奖励`,
  value: 'nestClaim',
  estimateGasFee: (signer: Wallet) => estimateGasFee(signer, getCalls()),
  sendTransaction: (signer: Wallet) => sendTransaction(signer, getCalls()),
}
