function createNeedingService(execlib,ParentServicePack){
  'use strict';
  var ParentService = ParentServicePack.Service,
      execSuite = execlib.execSuite,
      taskRegistry = execSuite.taskRegistry,
      dataSuite = execlib.dataSuite,
      filterFactory = dataSuite.filterFactory,
      lib = execlib.lib;

  function factoryCreator(parentFactory){
    return {
      'service': require('./users/serviceusercreator')(execlib,parentFactory.get('service')),
      'user': require('./users/usercreator')(execlib,parentFactory.get('user')) 
    };
  }

  function produceUnsatisfiedFilterDescriptor(satisfactiondescriptor){
    if(lib.isString(satisfactiondescriptor)){
      return {
        op: 'notexists',
        field: satisfactiondescriptor
      };
    }
    var check = filterFactory.createFromDescriptor(satisfactiondescriptor);
    if(!check){
      var e = new lib.Error('INVALID_DATA_FILTER_DESCRIPTOR');
      e.descriptor = satisfactiondescriptor;
      throw e;
    }
    return {
      op: 'not',
      filter: satisfactiondescriptor
    };
  }

  function NeedingService(prophash){
    ParentService.call(this,prophash);
    this.global = false; //needs are not globally registered by default
    if(!('satisfaction' in prophash)){
      throw new lib.Error('NO_SATISFACTION_FOR_NEEDING_SERVICE','Property hash misses the satisfaction field');
    }
    this.unsatisfiedFilterDescriptor = produceUnsatisfiedFilterDescriptor(prophash.satisfaction);
    this.satisfactionMonitor = null;
  }
  ParentService.inherit(NeedingService,factoryCreator,require('./storagedescriptor'));
  NeedingService.prototype.__cleanUp = function(){
    if(this.satisfactionMonitor){
      throw new lib.Error('SATIFACTION_MONITOR_SHOULD_NOT_EXIST_IN_CLEANUP');
    }
    this.unsatisfiedFilterDescriptor = null;
    ParentService.prototype.__cleanUp.call(this);
  };
  NeedingService.prototype.close = function(){
    if(this.satisfactionMonitor){
      this.satisfactionMonitor.destroy();
    }
    this.satisfactionMonitor = null;
    ParentService.prototype.close.call(this);
  };
  NeedingService.prototype.introduceUser = function(userhash){
    if(userhash && userhash.filter && userhash.filter==='unsatisfied'){
      userhash.filter = this.unsatisfiedFilterDescriptor;
    }
    return ParentService.prototype.introduceUser.call(this,userhash);
  };
  NeedingService.prototype.createStorage = function(storagedescriptor){
    return ParentService.prototype.createStorage.call(this,storagedescriptor);
  };
  NeedingService.prototype.onSuperSink = function(supersink){
    supersink.subConnect('.',{role:'user',name:'bla',filter:'unsatisfied'},{}).done(
      this.onUnsatisfiedUser.bind(this),
      function(){
        console.error('nok',arguments);
      }
    );
  };
  NeedingService.prototype.onUnsatisfiedUser = function(unsatisfiedsink){
    this.satisfactionMonitor = unsatisfiedsink;
    taskRegistry.run('materializeQuery',{
      sink: unsatisfiedsink,
      continuous: true,
      data: [],
      onRecordDeletion: this.onNeedSatisfied.bind(this)
    });
  };
  NeedingService.prototype.onNeedSatisfied = function(satisfieddatahash){
    var instancename = satisfieddatahash.instancename;
    var subsink = this.subservices.get(instancename);
    if(!subsink){
      console.error('No need found that is named',instancename);
      return;
    }
    subsink.destroy();
  };
  return NeedingService;
}

module.exports = createNeedingService;
