function createNeedingService(execlib,ParentServicePack){
  var ParentService = ParentServicePack.Service,
    dataSuite = execlib.dataSuite;

  function factoryCreator(parentFactory){
    return {
      'service': require('./users/serviceusercreator')(execlib,parentFactory.get('service')),
      'user': require('./users/usercreator')(execlib,parentFactory.get('user')) 
    };
  }

  function NeedingService(prophash){
    ParentService.call(this,prophash);
  }
  ParentService.inherit(NeedingService,factoryCreator,require('./storagedescriptor'));
  NeedingService.prototype.__cleanUp = function(){
    ParentService.prototype.__cleanUp.call(this);
  };
  NeedingService.prototype.createStorage = function(storagedescriptor){
    return ParentService.prototype.createStorage.call(this,storagedescriptor);
  };
  return NeedingService;
}

module.exports = createNeedingService;
