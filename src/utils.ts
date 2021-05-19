import * as fs from 'fs'
import { BigNumber } from 'bignumber.js'

/** Generic and useful utility functions. */

/**
 * Write a set to a map. 
 * 
 * There's definitely a better way to do this - extreme frustration from TypeScript's set type. 
 */
export const setToMap = (set: Set<string>, value = new BigNumber("1")): Map<string, BigNumber> => {
  const map = new Map<string, BigNumber>()
  for (let item of set) {
    map.set(item, value)
  }
  return map
}

/** 
 * Combine sets.
 *
 * There's definitely a better way to do this - extreme frustration from TypeScript's set type. 
 */
export const combineSets = (a: Set<string>, b: Set<string>): Set<string> => {
  const set = new Set<string>()

  // Add from set a
  for (let item of a) {
    set.add(item)
  }

  // Add from set b
  for (let item of b) {
    set.add(item)
  }

  return set
}


/** 
 * Turn an array into a set. 
 *
 * There's definitely a better way to do this - extreme frustration from TypeScript's set type. 
 */
export const arrayToSet = (array: Array<string>): Set<string> => {
  const set = new Set<string>()
  for (let i = 0; i < array.length; i++) {
    set.add(array[i])
  }
  return set
}

/** Sleep the thread - used for rate limiting. */
export const sleep = async (seconds: number): Promise<void> => {
  const milliseconds = seconds * 1000
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

/** Write CSV Data. */
export const writeCSV = (data: Map<string, BigNumber>, filename: string) => {
  // Print results to file
  if (fs.existsSync(filename)) {
    fs.unlinkSync(filename)
  }
  fs.writeFileSync(filename, `address, points,\n`)

  for (let [address, balance] of data) {
    fs.appendFileSync(
      filename,
      `${address}, ${balance.toFixed()},\n`,
    )
  }
}