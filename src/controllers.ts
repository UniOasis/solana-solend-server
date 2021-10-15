import {Request, Response} from 'express';
import {PublicKey, Connection, clusterApiUrl} from '@solana/web3.js'
import BN from "bn.js";
import {ObligationParser} from './lib/solend/obligation'

/**
 * version: u8(1 byte)
 * Last_Update: {
 *  slot: u64(8 bytes)
 *  stale: bool(1 byte)
 * }
 * lending_market: PubKey(32 bytes)
 * owner: PubKey(32 bytes)
 * deposits:[ObligationCollateral]
 * ObligationCollateral: {
 *  deposit_reserve: PubKey(32 bytes)
 *  deposited_amount: u64
 *  market_value: Decimal(u64, u128, u192)
 * }
 * borrows: [ObligationLiquidity]
 * ObligationLiquidity: {
 *  borrow_reserve: PubKey(32 bytes)
 *  cumulative_borrow_rate_wads: Decimal(u64, u128, u192)
 *  borrowed_amount_wads: Decimal(u64, u128, u192)
 *  market_value: Decimal(u64, u128, u192)
 * }
 * deposited_value: u64, u128, u192
 * borrowed_value: u64, u128, u192
 * allowed_borrow_value: u64, u128, u192
 * unhealthy_borrow_value: u64, u128, u192
 * 1300-74=1226
 */
export const getSolendUserDepositBalance = async (req: Request, res: Response) => {
  const SOLEND_PROGRAM_ID = new PublicKey('So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo')
  const MAIN_LENDING_MARKET = '4UpD2fh7xH3VP9QQaXtsS1YY3bxzWhtfpks7FatyKvdY'
  // should be params
  const TEST_ACCOUNT = 'HZ9zDY2tLGiuK4Vt78U5btzWySsLpCcgTegTcVGuFdmJ'
  const OBLIGATION_LEN = 1300
  type RerserveKey = {
    [key: string]: string;
  };
  const RESERVES_TO_ASSET_MAP: RerserveKey = {
    "8PbodeaosQP19SjYFx855UMqWxH2HynZLdBXmsrbac36": "SOL",
    "BgxfHJDzm44T7XG68MYKx7YisTjZu73tVovyZSjJMpmw": "USDC",
    "3PArRsZQ6SLkr1WERZWyC6AqsajtALMq4C66ZMYz4dKQ": "ETH",
    "GYzjMCXTDue12eUGKKWAqtF5jcBYNmewr6Db6LaguEaX": "BTC",
  };

  const connection = new Connection(
    clusterApiUrl("mainnet-beta"),
    "confirmed"
  );
  // const connection = new Connection(
  //   "https://api.mainnet-beta.solana.com",
  //   "confirmed"
  // );
  // test obligation account
  const obligationAccount = '6DqQ6mDaRrx9Wuwj3bkxJ8QNZxhzX1bKmXBswFYcCg4L'

  const accInfo = await connection.getProgramAccounts(
    SOLEND_PROGRAM_ID,
    {
      commitment: connection.commitment,
      filters: [
        // {
        //   memcmp: {
        //     offset: 10,
        //     bytes: MAIN_LENDING_MARKET,
        //   },
        // },
        {
          memcmp: {
            offset: 42,
            bytes: TEST_ACCOUNT,
          },
        },
        {
          dataSize: OBLIGATION_LEN,
        },
      ],
      encoding: "base64",
    }
  );
  console.log("Number of users:", accInfo.length);
  const obligations = accInfo.map((account) =>
    ObligationParser(account.pubkey, account.account)
  );
  console.log({obligations: obligations[0]})

  type UserDeposits = {
    [key: string]: number;
  };
  const userDeposits:UserDeposits = {}
  for (const deposit of obligations[0]?.info.deposits) {
    const reserve:string = deposit.depositReserve.toBase58();
    if (!(reserve in RESERVES_TO_ASSET_MAP)) {
      console.log(
        "WARNING: Unrecognized reserve. Update RESERVES_TO_ASSET_MAP."
      );
      continue;
    }
    // @ts-ignore
    const asset = RESERVES_TO_ASSET_MAP[reserve];
    if (!(asset in userDeposits)) {
      userDeposits[asset] = new BN(deposit.depositedAmount).toNumber();
    }
  }

  res.send(userDeposits)
}