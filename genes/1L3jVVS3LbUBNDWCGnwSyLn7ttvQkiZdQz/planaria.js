/***************************************
*
* API Reference: https://docs.planaria.network/#/api?id=anatomy-of-a-planaria
*
***************************************/
module.exports = {
  planaria: '0.0.1',
  from: HEIGHT,
  name: 'cftest',
  version: '0.0.1',
  description: '',
  address: '1L3jVVS3LbUBNDWCGnwSyLn7ttvQkiZdQz',
  index: {},
  onmempool: async function(m) {
    // Triggered for every mempool tx event
    // https://docs.planaria.network/#/api?id=onmempool
  },
  onblock: async function(m) {
    // Triggered for every new block event
    // https://docs.planaria.network/#/api?id=onblock
  },
  onrestart: async function(m) {
    // Clean up for when the nede restarts
    // https://docs.planaria.network/#/api?id=onrestart
  }
}
