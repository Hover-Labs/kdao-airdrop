import CONFIG from './config'
import { getOvensAboveThreshold } from './oven-utils'
import { combineSets, setToMap, writeCSV } from './utils'
import BigNumber from 'bignumber.js'
import findContractInteractions from './find-contract-interactions'

const main = async () => {
  console.log("Welcome to the Kolibri Airdrop script!")

  // Get all users who borrowed from an oven.
  console.log("Getting all ovens who have borrowed kUSD...")
  const addressesFromOvenBorrows = await getOvensAboveThreshold(
    CONFIG.BORROW_THRESHOLD,
    CONFIG.SNAPSHOT_START_BLOCK,
    CONFIG.SNAPSHOT_END_BLOCK,
    CONFIG.SNAPSHOT_LENGTH
  )
  console.log("Done.\n")

  // All users who supplied Dexter liquidity
  console.log("Getting all addresses which supplied kUSD liquidity to Dexter...")
  const addressesFromDexter = await findContractInteractions(
    'KT1AbYeDbjjcAnV1QK7EZUUdqku77CdkTuv6', // Dexter Liquidity Pool
    'addLiquidity',
    CONFIG.SNAPSHOT_START_BLOCK,
    CONFIG.SNAPSHOT_END_BLOCK,
  )
  console.log("Done.\n")

  // All users who supplied Quipuswap v1 liquidity
  console.log("Getting all addresses which supplied liquidity to Quipuswap v1.0...")
  const addressFromQuipuswapOld = await findContractInteractions(
    'KT1CiSKXR68qYSxnbzjwvfeMCRburaSDonT2', // Quipuswap 1.0 Liquidity Pool 
    'investLiquidity',
    CONFIG.SNAPSHOT_START_BLOCK,
    CONFIG.SNAPSHOT_END_BLOCK,
  )
  console.log("Done.\n")

  // All users who supplied Quipuswap v1.1 liquidity
  console.log("Getting all addresses which supplied liquidity to Quipuswap v1.1...")
  const addressFromQuipuswapNew = await findContractInteractions(
    'KT1K4EwTpbvYN9agJdjpyJm4ZZdhpUNKB3F6', // Quipuswap v1.1 Liquidity Pool 
    'investLiquidity',
    CONFIG.SNAPSHOT_START_BLOCK,
    CONFIG.SNAPSHOT_END_BLOCK,
  )
  console.log("Done.\n")

  // All users who supplied Liquidity Pool liquidity
  console.log("Getting all addresses which supplied liquidity to The Kolibri liquidity pool...")
  const addressesFromLiqiquidityPool = await findContractInteractions(
    'KT1AxaBxkFLCUi3f8rdDAAxBKHfzY8LfKDRA', // QLkUSD Contract 
    'deposit',
    CONFIG.SNAPSHOT_START_BLOCK,
    CONFIG.SNAPSHOT_END_BLOCK,
  )
  console.log("Done.\n")

  // All users who executed a governance proposal
  console.log("Getting all users who executed a governance proposal....")
  const addressesFromGovernance = await findContractInteractions(
    'KT1JBmbYxTv3xptk2CadgEdMfjUCUXKEfe5u', // Kolibri Timelock Multisig
    'execute',
    CONFIG.SNAPSHOT_START_BLOCK,
    CONFIG.SNAPSHOT_END_BLOCK,
  )
  console.log("Done.\n")

  // Write data for debugging purposes.
  console.log("Writing Debug Data...")
  writeCSV(setToMap(addressesFromOvenBorrows), 'oven-borrowers.csv')
  writeCSV(setToMap(addressesFromDexter), 'dexter-lps.csv')
  writeCSV(setToMap(addressFromQuipuswapOld), 'quipu-lps-old.csv')
  writeCSV(setToMap(addressFromQuipuswapNew), 'quipu-lps-new.csv')
  writeCSV(setToMap(addressesFromLiqiquidityPool), 'kolibri-lps.csv')
  writeCSV(setToMap(addressesFromGovernance), 'governance.csv')
  console.log("Done.\n")

  // Combine everything.
  console.log("Totalling everything up!")
  let allAddresses = combineSets(addressesFromOvenBorrows, addressesFromDexter)
  allAddresses = combineSets(allAddresses, addressFromQuipuswapOld)
  allAddresses = combineSets(allAddresses, addressFromQuipuswapNew)
  allAddresses = combineSets(allAddresses, addressesFromLiqiquidityPool)
  allAddresses = combineSets(allAddresses, addressesFromGovernance)

  // Filter all addresses
  for (const address of CONFIG.FILTER_ADDRESSES) {
    allAddresses.delete(address)
  }

  // Total all addresses.
  const finalMap = new Map<string, BigNumber>()
  let totalCredits = 0;
  for (let item of allAddresses) {
    let credits = 0;
    if (addressesFromOvenBorrows.has(item)) {
      totalCredits++
      credits++
    }

    if (addressesFromDexter.has(item)) {
      totalCredits++
      credits++
    }

    if (addressFromQuipuswapOld.has(item)) {
      totalCredits++
      credits++
    }

    if (addressFromQuipuswapNew.has(item)) {
      totalCredits++
      credits++
    }

    if (addressesFromLiqiquidityPool.has(item)) {
      totalCredits++
      credits++
    }

    if (addressesFromGovernance.has(item)) {
      totalCredits++
      credits++
    }

    finalMap.set(item, new BigNumber(credits))
  }
  console.log("Done.\n")

  // Compute point allocations
  const tokensPerCredit = CONFIG.TOKEN_AMOUNT.dividedBy(new BigNumber(totalCredits))
  finalMap.forEach((value: BigNumber, key: string) => {
    finalMap.set(key, value.times(tokensPerCredit))
  });
  console.log(`Each user gets ${tokensPerCredit} for each action.`)

  // Write final data.
  console.log("Writing final output...")
  writeCSV(finalMap, 'airdrop-data.csv')
  console.log("Airdrop Data Gathering Complete!\n")
}

main()