import { run as manual } from './commands/manual'
import { run as auto } from './commands/auto'

const run = process.env.AUTO === 'true' ? auto : manual

run()
