import BigNumber from "bignumber.js";
import * as WebRequest from 'web-request'

const getAllInteractions = async (contractAddress: string, entrypoint: string, startBlock: BigNumber, endBlock: BigNumber): Promise<Set<string>> => {
  const addressesWhoInteracted: Set<string> = new Set<string>()

  const limit = new BigNumber('100')
  let offset = new BigNumber('0')

  while (1) {
    try {
      // Fetch operations
      const apiUrl = `https://api.tzkt.io/v1/operations/transactions?target=${contractAddress}&status=applied&sort=id&limit=${limit.toFixed()}&offset=${offset.toFixed()}&entrypoint=${entrypoint}`
      const result: any = await WebRequest.get(apiUrl)
      const data = JSON.parse(result.message.body)


      // Add each invocation to the set, if it occurred before the time.
      for (let i = 0; i < data.length; i++) {
        const tx = data[i]

        const level = new BigNumber(tx.level)
        if (level.isGreaterThanOrEqualTo(startBlock) && level.isLessThanOrEqualTo(endBlock)) {
          addressesWhoInteracted.add(tx.sender.address)
        }
      }

      if (data.length !== limit.toNumber()) {
        break
      }

      offset = offset.plus(limit)
    } catch (e) {
      console.log("Failed on iteration. Will retry...")
      console.log(JSON.stringify(e))
    }
  }

  return addressesWhoInteracted
}

export default getAllInteractions
