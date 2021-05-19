import { BigNumber } from 'bignumber.js'
import * as WebRequest from 'web-request'
import { arrayToSet, combineSets, sleep } from './utils'

/** Contains utility functions for working with ovens. */

let total = 0
let complete = 0

/** 
 * Retrieve all ovens that ever had a balance above the threshold on a snapshot block.
 * 
 * @param threshold The number of kUSD borrowed.
 * @param startBlock The start block for snapshotting, inclusive.
 * @param endBlock The end block for snapshotting, exclusive.
 * @param snapshotLength The lenght of blocks in a snapshot.
 * @returns A set of addresses which owned ovens that had a balance above a threshold in a snapshot.
 */
export const getOvensAboveThreshold = async (threshold: BigNumber, startBlock: BigNumber, endBlock: BigNumber, snapshotLength: BigNumber): Promise<Set<string>> => {
  // Get all ovens that currently exist.
  const ovenUrl = `https://kolibri-data.s3.amazonaws.com/mainnet/oven-data.json`
  const result: any = await WebRequest.get(ovenUrl)
  const data = JSON.parse(result.message.body)
  let allOvenData = data.allOvenData

  const snapshotLevels = []
  let currentSnapshotLevel = new BigNumber(endBlock)
  while (currentSnapshotLevel.isGreaterThanOrEqualTo(startBlock)) {
    snapshotLevels.push(currentSnapshotLevel)
    currentSnapshotLevel = currentSnapshotLevel.minus(snapshotLength)
  }

  total = snapshotLevels.length * allOvenData.length
  console.log(`Will need ${total} datapoints. This will take a while....`)

  const promises: Array<Promise<Set<string>>> = snapshotLevels.map((snapshotLevel) => {
    return resolveLevel(allOvenData, threshold, snapshotLevel)
  })

  const resolved: Array<Set<string>> = await Promise.all(promises)
  const ownersAboveThreshold = resolved.reduce((accumulated, next) => {
    return combineSets(accumulated, next)
  }, new Set<string>())


  return ownersAboveThreshold
}

/** Resolve all ovens above a threshold at a given level. */
const resolveLevel = async (allOvenData: any, threshold: BigNumber, snapshotLevel: BigNumber): Promise<Set<string>> => {
  let ownersAboveThreshold = new Set<string>()

  for (let i = 0; i < allOvenData.length; i++) {
    const ovenData = allOvenData[i]
    try {
      const borrowedAmount = await getBorrowedkUSDAtLevel(ovenData.ovenAddress, snapshotLevel)
      if (borrowedAmount.isGreaterThanOrEqualTo(threshold)) {
        ownersAboveThreshold.add(ovenData.ovenOwner)
      }

      complete++
      if (complete % 1000 == 0) {
        console.log(`${complete} / ${total} Resolved`)
      }

      await sleep(.5)
    } catch (e) {
      // Decrement i to retry.
      i--

      // Sleep a random period of time.
      await sleep(60 * Math.random())
    }

  }

  return ownersAboveThreshold
}

// Get the number of kUSD borrowed by an oven at any given level.
const getBorrowedkUSDAtLevel = async (oven: string, level: BigNumber): Promise<BigNumber> => {
  const apiUrl = `https://api.tzkt.io/v1/contracts/${oven}/storage?level=${level.toFixed()}`
  const result: any = await WebRequest.get(apiUrl)

  // Bail if the contract didn't exist at the given height. 
  if (result.statusCode == 204) {
    return new BigNumber(0)
  }

  const storage = JSON.parse(result.message.body)
  return new BigNumber(storage.borrowedTokens)
}
