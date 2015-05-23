function createServicePack(execlib){
  var execSuite = execlib.execSuite,
      ServiceCollectionServicePack = execSuite.registry.register('allex_servicecollectionservice'),
      ParentServicePack = ServiceCollectionServicePack;

  return {
    Service: require('./servicecreator')(execlib,ParentServicePack),
    SinkMap: require('./sinkmapcreator')(execlib,ParentServicePack)
  };
}

module.exports = createServicePack;
