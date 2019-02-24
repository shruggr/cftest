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
    fighter: {
      keys: [
        'tx.h', 'blk.i', 'blk.t', 'blk.h'
      ],
      unique: ['tx.h']
    }
  },
  onmempool: async function(m) {
    // Triggered for every mempool tx event
    // https://docs.planaria.network/#/api?id=onmempool
    console.log("## onmempool", m.input)
    // await m.state.create({
    //   name: "u",
    //   data: m.input
    // }).catch(function(e) {
    //   console.log("# onmempool error = ", e)
    // })
    // m.output.publish({
    //   name: "u",
    //   data: m.input
    // })
  },
  onblock: async function(m) {
    // Triggered for every new block event
    // https://docs.planaria.network/#/api?id=onblock
    console.log("## onblock", "Block Size: ", m.input.block.items.length, "Mempool Size: ", m.input.mempool.items.size)
    await m.state.create({
      name: "fighter",
      data: m.input.block.items
        .filter((txn) => {
          const opRet = txn.out.find((out) => out.b0.op == 106);
          return opRet && opRet.s1 == "167WW15VDSqTx4EJ8RtUtVUWxhSy6HZ6kk"
        })
        .map((txn) => {
          const opRet = txn.out.find((out) => out.b0.op == 106);
          return {
            tx: txn.tx,
            blk: txn.blk,
            fighter: opRet.s2
          }
        }),
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

    m.input.block.items.forEach(function(i) {
      m.output.publish({
        name: "fighter",
        data: i
      })
    })
  },
  onrestart: async function(m) {
    // Clean up from the last clock timestamp
    await m.state.delete({
      name: 'fighter',
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
    // The state machine will resume after this function returns
  }
}
