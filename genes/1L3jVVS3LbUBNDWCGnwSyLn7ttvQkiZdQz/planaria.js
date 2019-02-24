/***************************************
*
* API Reference: https://docs.planaria.network/#/api?id=anatomy-of-a-planaria
*
***************************************/
const BATTLE = "18pojMVnZYDa19aqEo46ZdE1FSQBwU54zX";
const COMMIT = "1DknJFhdEkwgn4hCWL4iCBWg7ZKm1h2hNC";
const INIT = "1AS2ESCbWKo6HVbEy7aznkCgQunPfT6hBN";
const STATE = "1KgH6URXsAxte9xsuetviVd2kH4Zn3YU1C";
const VALIDATOR = "149qjwS8MsJQszQu7Rsybya2zrm6Ff5Qhe";
const FIGHTER = "167WW15VDSqTx4EJ8RtUtVUWxhSy6HZ6kk";

module.exports = {
  planaria: '0.0.1',
  from: 570000,
  name: 'cftest',
  version: '0.0.1',
  description: '',
  address: '1L3jVVS3LbUBNDWCGnwSyLn7ttvQkiZdQz',
  index: {
    battle: {
      keys: ['txnId'],
      unique: ['txnId']
    }
  },
  onmempool: async function (m) {
    // const opRet = m.input.out.find((out) => out.b0.op == 106);
    // if(opRet && opRet.s1 == BATTLE) {
    //   m.state.create({
    //     name: 'battle',
    //     data: {
    //       txnId: m.index.tx.h,
    //       hashChain: opRet.s2,
    //       commitTxns: [opRet.s3, opRet.s4]
    //     }
    //   })
    // }
  },
  onblock: async function (m) {

    m.state.create({
      name: 'battle',
      data: m.input.items
        .filter((txn) => {
          const opRet = txn.out.find((out) => out.b0.op == 106);
          return opRet && opRet.s1 == BATTLE;
        })
        .map((txn) => {
          const opRet = txn.out.find((out) => out.b0.op == 106);
          return {
            txnId: txn.tx.h,
            hashChain: opRet.s2,
            commitTxns: [opRet.s3, opRet.s4]
          }
        })
    });
    // Triggered for every new block event
    // https://docs.planaria.network/#/api?id=onblock
  },
  onrestart: async function (m) {
    // Clean up for when the nede restarts
    // https://docs.planaria.network/#/api?id=onrestart
  }
}
