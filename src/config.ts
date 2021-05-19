import { BigNumber } from 'bignumber.js'

/** Configuration for script */

const CONFIG = {
  /** Snapshot configuration */
  SNAPSHOT_START_BLOCK: new BigNumber('1330056'),
  SNAPSHOT_END_BLOCK: new BigNumber('1461096'),
  SNAPSHOT_LENGTH: new BigNumber(24 * 60), // 1x a day

  // Amount of tokens to give out.
  TOKEN_AMOUNT: new BigNumber('150000'),

  /** Criteria configuration */
  // Amount needed to borrow to qualify.
  BORROW_THRESHOLD: new BigNumber(10).times(new BigNumber(10).pow(18)), // 10 kUSD

  // Addresses to filter
  FILTER_ADDRESSES: [
  ]
}
export default CONFIG
