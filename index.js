function createServicePack(execlib){
  'use strict';

  return {
    service: {
      dependencies: ['allex:servicecollection']
    },
    sinkmap: {
      dependencies: ['allex:servicecollection']
    },
    tasks: {
      dependencies: []
    }
  };
}

module.exports = createServicePack;
