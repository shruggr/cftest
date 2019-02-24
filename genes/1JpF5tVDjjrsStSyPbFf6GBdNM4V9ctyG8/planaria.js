/***************************************
*
* Crawl Everything
*
* API Reference: https://docs.planaria.network/#/api?id=anatomy-of-a-planaria
*
***************************************/
module.exports = {
  planaria: '0.0.1',
  from: 570000,
  name: 'cftest',
  version: '0.0.1',
  description: '',
  address: '1JpF5tVDjjrsStSyPbFf6GBdNM4V9ctyG8',
  index: {
    b: {
      keys: ['blk.i', 'tx.h', 'commitTxns'],
      unique: ['tx.h'],
      fulltext: []
    }
  },
  onmempool: async function(m) {
    // Triggered for every mempool tx event
    // https://docs.planaria.network/#/api?id=onmempool

  },
  onblock: async function(m) {
    // Triggered for every new block event
    // https://docs.planaria.network/#/api?id=onblock
    console.log("## onblock", "Block Size: ", m.input.block.items.length, "Mempool Size: ", m.input.mempool.items.size)
    await m.state.create({
      name: "b",
      data: m.input.block.items,
        // .filter((txn) => txn.out[0].s1 == '18pojMVnZYDa19aqEo46ZdE1FSQBwU54zX')
        // .map((txn) => {
        //   return {
        //     blk: txn.blk,
        //     tx: txn.tx,
        //     hashChain: txn.out[0].s2,
        //     commitTxns: [txn.out[0].s3, txn.out[0].s4]
        //   }
        // }),
      onerror: function(e) {
        if (e.code != 11000) {
          console.log("# Error", e, m.input, m.clock.bitcoin.now, m.clock.self.now)
          process.exit()
        }
      }
    }).catch(function(e) {
      console.log("# onblock error = ", e)
      process.exit()
    })
    m.input.block.items.forEach((i) => {
      m.output.publish({
        name: "b",
        data: i
      })
    })
  },
  onrestart: async function(m) {
    // Clean up from the last clock timestamp
    await m.state.delete({
      name: 'b',
      filter: {
        find: {
          "blk.i": { $gt: m.clock.self.now }
        }
      },
      onerror: function(e) {
        // duplicates are ok because they will be ignored
        if (e.code !== 11000) {
          console.log('## ERR ', e, m.clock.bitcoin.now, m.clock.self.now)
          process.exit()
        }
      }
    }).catch(function(e) {
      console.log("# onrestart error = ", e)
    })
  }
}
