function createServicePack(execlib){
  'use strict';
  var execSuite = execlib.execSuite,
      ServiceCollectionServicePack = execSuite.registry.register('allex_servicecollectionservice'),
      ParentServicePack = ServiceCollectionServicePack;

  return {
    Service: require('./servicecreator')(execlib,ParentServicePack),
    SinkMap: require('./sinkmapcreator')(execlib,ParentServicePack),
    Tasks: [{
      name: 'consumeNeedingService',
      klass: require('./tasks/consumeneedingservice')(execlib)
    }]
  };
}

module.exports = createServicePack;
