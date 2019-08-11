require("ts-node/register");

const {setup} = require("./testSetup");

module.exports = async function() {
    
    if (!process.env.TEST_HOST) {
      await setup();
    }
    return null;
  };