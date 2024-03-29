function createNeedingService(execlib,ParentService){
  'use strict';
  var execSuite = execlib.execSuite,
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
  }
  ParentService.inherit(NeedingService,factoryCreator,require('./storagedescriptor'));
  NeedingService.prototype.__cleanUp = function(){
    this.unsatisfiedFilterDescriptor = null;
    ParentService.prototype.__cleanUp.call(this);
  };
  NeedingService.prototype.createStorage = function(storagedescriptor){
    return ParentService.prototype.createStorage.call(this,storagedescriptor);
  };
  NeedingService.prototype.onSuperSink = function(supersink){
    taskRegistry.run('materializeQuery',{
      sink: supersink,
      continuous: true,
      filter: this.unsatisfiedFilterDescriptor,
      data: [],
      onRecordDeletion: this.onNeedSatisfied.bind(this)
    });
    return ParentService.prototype.onSuperSink.call(this, supersink);
  };
  NeedingService.prototype.preprocessQueryPropertyHash = function (querypropertyhash) {
    if (querypropertyhash && querypropertyhash.filter === 'unsatisfied') {
      querypropertyhash.filter = this.unsatisfiedFilterDescriptor;
    }
    return querypropertyhash;
  };
  NeedingService.prototype.onNeedSatisfied = function(satisfieddatahash){
    var instancename, subsink;
    if (!satisfieddatahash) {
      return;
    }
    if (!this.subservices) {
      return;
    }
    instancename = satisfieddatahash.instancename;
    subsink = this.subservices.get(instancename);
    if(!subsink){
      console.error('No need found that is named',instancename);
      return;
    }
    subsink.destroy();
  };
  return NeedingService;
}

module.exports = createNeedingService;
