const { BATTLE, COMMIT, FIGHTER, INIT } = require('./constants');

function commitMap(txn) {
  const opRet = txn.out.find((out) => out.b0.op == 106);
  return {
    tx: txn.tx,
    blk: txn.blk,
    v: opRet.s2,
    c: opRet.b3
  }
}

function fighterMap(txn) {
  const opRet = txn.out.find((out) => out.b0.op == 106);
  try {
    const fighter = JSON.parse(opRet.s2);
    fighter.id = txn.tx.h;
    return {
      tx: txn.tx,
      blk: txn.blk,
      o: txn.in[0].e.a,
      f: fighter
    }
  }
  catch (e) {
    console.log(`# fighterMap: `, e);
    return
  }
}

function battleMap(txn) {
  const opRet = txn.out.find((out) => out.b0.op == 106);
  return {
    tx: txn.tx,
    blk: txn.blk,
    h: opRet.b2,
    c: [
      opRet.s3,
      opRet.s4
    ]
  }
}

function initMap(txn) {
  const opRet = txn.out.find((out) => out.b0.op == 106);
  return {
    tx: txn.tx,
    blk: txn.blk,
    h: opRet.b2,
    b: txn.in[0].e.h,
    f: opRet.s2,
    a: opRet.s3,
    m: opRet.s4,
    o: opRet.s5
  }
}

function create(m, collection, values) {
  values = values.filter((value) => value);
  return m.state
    .create({
      name: collection,
      data: values,
      onerror: function (e) {
        if (e.code != 11000) {
          console.log("# Error", e, m.input, m.clock.bitcoin.now, m.clock.self.now)
          process.exit()
        }
      }
    })
    .catch(function (e) {
      if (e.code != 11000) {
        console.log("# onblock error = ", e)
        process.exit()
      }
    })
    .then(() => {
      for (let value of values) {
        m.output.publish({
          name: collection,
          data: value
        });
      }
    });
}

/***************************************
*
* Crawl Everything
*
* API Reference: https://docs.planaria.network/#/api?id=anatomy-of-a-planaria
*
***************************************/
const planaria =  {
  planaria: '0.0.1',
  from: 571220,
  name: 'cftest',
  version: '0.0.1',
  description: '',
  address: '1JpF5tVDjjrsStSyPbFf6GBdNM4V9ctyG8',
  index: {
    battle: {
      keys: [
        'tx.h', 'blk.i', 'blk.t', 'blk.h', 'c'
      ],
      unique: ['tx.h'],
    },
    commit: {
      keys: [
        'tx.h', 'blk.i', 'blk.t', 'blk.h', 'v', 'c', 'b'
      ],
      unique: ['tx.h']
    },
    fighter: {
      keys: [
        'tx.h', 'blk.i', 'blk.t', 'blk.h', 'o'
      ],
      unique: ['tx.h']
    },
    init: {
      keys: [
        'tx.h', 'blk.i', 'blk.t', 'blk.h', 'b', 'f', 'a', 'm', 'o'
      ],
      unique: ['tx.h']
    }
  },
  onmempool: async function (m) {
    // Triggered for every mempool tx event
    // https://docs.planaria.network/#/api?id=onmempool
    const opRet = m.input.out.find((out) => out.b0.op == 106);
    if (!opRet) return;

    switch (opRet.s1) {
      case COMMIT:
        await create(m, 'commit', [commitMap(m.input)]);
        console.log("## onmempool - commit", m.input.tx.h);
        break;
      case FIGHTER:
        await create(m, 'fighter', [fighterMap(m.input)]);
        console.log("## onmempool - fighter", m.input.tx.h);
        break;
      case BATTLE:
        await create(m, 'battle', [battleMap(m.input)]);
        console.log("## onmempool - battle", m.input.tx.h);
        const commitBattles = {};
        commitBattles[opRet.s3] = m.input.tx.h;
        commitBattles[opRet.s4] = m.input.tx.h;
        await m.state.update({
          name: 'commit',
          filter: {
            find: {
              "tx.h": {$in: Object.keys(commitBattles)}
            }
          },
          map: (commit) => {
            commit.b = commitBattles[commit.tx.h]
            return commit;
          }
        })
        .catch(function(e) {
          if (e.code != 11000) {
            console.log("# onmempool error = ", e)
            process.exit()
          }
        })
        break;
      case INIT:
        await create(m, 'init', [initMap(m.input)]);
        console.log("## onmempool - init", m.input.tx.h);
        break;
    }
  },
  onblock: async function (m) {
    // Triggered for every new block event
    // https://docs.planaria.network/#/api?id=onblock
    console.log("## onblock", "Block Size: ", m.input.block.items.length, "Mempool Size: ", m.input.mempool.items.size)

    const commits = [];
    const fighters = [];
    const battles = [];
    const inits = [];
    const commitBattles = {};

    for (let txn of m.input.block.items) {
      const opRet = txn.out.find((out) => out.b0.op == 106);
      if (!opRet) continue;

      switch (opRet.s1) {
        case COMMIT:
          commits.push(txn);
          break;
        case FIGHTER:
          fighters.push(txn);
          break;
        case BATTLE:
          battles.push(txn);
          commitBattles[opRet.s3] = txn.tx.h;
          commitBattles[opRet.s4] = txn.tx.h;
          break;
        case INIT:
          inits.push(txn);
          break;
        }
    }

    if (fighters.length) {
      await create(m, 'fighter', fighters.map(fighterMap));
    }

    if (commits.length) {
      await create(m, 'commit', commits.map(commitMap));
    }

    if (battles.length) {
      await create(m, 'battle', battles.map(battleMap));
    }

    if (inits.length) {
      await create(m, 'init', inits.map(initMap));
    }

    if(Object.keys(commitBattles).length) {
      await m.state.update({
        name: 'commit',
        filter: {
          find: {
            "tx.h": {$in: Object.keys(commitBattles)}
          }
        },
        map: (commit) => {
          commit.b = commitBattles[commit.tx.h];
          return commit;
        },
        // onerror: function (e) {
        //   if (e.code != 11000) {
        //     console.log("# Error", e, m.input, m.clock.bitcoin.now, m.clock.self.now)
        //     process.exit()
        //   }
        // }
      })
      .catch(function(e) {
        if (e.code != 11000) {
          console.log("# onblock error = ", e, m.clock.bitcoin.now, m.clock.self.now);
          process.exit()
        }
      })
    }
  },
  onrestart: async function (m) {
    // Clean up from the last clock timestamp
    await Promise.all(Object.keys(planaria.index).map((coll) => {
      return m.state.delete({
        name: coll,
        filter: {
          find: {
            "blk.i": { $gt: m.clock.self.now }
          }
        },
        onerror: function (e) {
          // duplicates are ok because they will be ignored
          if (e.code !== 11000) {
            console.log('## ERR ', e, m.clock.bitcoin.now, m.clock.self.now)
            process.exit()
          }
        }
      });
    }))
    .catch(function (e) {
      console.log("# onrestart error = ", e);
    });


  // The state machine will resume after this function returns
  }
}

module.exports = planaria;