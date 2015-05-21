function createNeedingService(execlib,ParentServicePack){
  var ParentService = ParentServicePack.Service,
    dataSuite = execlib.dataSuite,
    lib = execlib.lib;

  function factoryCreator(parentFactory){
    return {
      'service': require('./users/serviceusercreator')(execlib,parentFactory.get('service')),
      'user': require('./users/usercreator')(execlib,parentFactory.get('user')) 
    };
  }

  function NeedingService(prophash){
    ParentService.call(this,prophash);
    this.global = false; //needs are not globally registered by default
    if(!('satisfaction' in prophash)){
      throw new lib.Error('NO_SATISFACTION_FOR_NEEDING_SERVICE','Property hash misses the satisfaction field');
    }
    this.satisfaction = prophash.satisfaction;
  }
  ParentService.inherit(NeedingService,factoryCreator,require('./storagedescriptor'));
  NeedingService.prototype.__cleanUp = function(){
    ParentService.prototype.__cleanUp.call(this);
  };
  NeedingService.prototype.introduceUser = function(userhash){
    if(userhash && userhash.filter && userhash.filter==='unsatisfied'){
      userhash.filter = {
        op: 'notexists',
        field: this.satisfaction
      };
    }
    return ParentService.prototype.introduceUser.call(this,userhash);
  };
  NeedingService.prototype.createStorage = function(storagedescriptor){
    return ParentService.prototype.createStorage.call(this,storagedescriptor);
  };
  return NeedingService;
}

module.exports = createNeedingService;
