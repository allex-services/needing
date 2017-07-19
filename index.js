function createServicePack(execlib){
  'use strict';

  return {
    service: {
      dependencies: ['allex_servicecollectionservice']
    },
    sinkmap: {
      dependencies: ['allex_servicecollectionservice']
    },
    tasks: {
      dependencies: []
    }
  };
}

module.exports = createServicePack;
