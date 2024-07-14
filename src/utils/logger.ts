import c from 'picocolors'
import { generateWalletTitle } from './index'

const logger = {
  info: (address: string, msg: string) => {
    console.log(
      `${c.blue('ℹ')} ${generateWalletTitle(address)} ${c.blue(msg)}`,
    )
  },
  error: (address: string, msg: string) => {
    console.log(`${c.red('✖')} ${generateWalletTitle(address)} ${c.red(msg)}`)
  },
  success: (address: string, msg: string) => {
    console.log(
      `${c.green('✔')} ${generateWalletTitle(address)} ${c.green(msg)}`,
    )
  },
}

export default logger
export type Logger = typeof logger
