function createServiceUser(execlib,ParentUser){
  var execSuite = execlib.execSuite,
      taskRegistry = execSuite.taskRegistry;

  if(!ParentUser){
    ParentUser = execlib.execSuite.ServicePack.Service.prototype.userFactory.get('user');
  }

  function ServiceUser(prophash){
    ParentUser.call(this,prophash);
  }
  ParentUser.inherit(ServiceUser,require('../methoddescriptors/serviceuser'),[],require('../visiblefields/serviceuser'));
  ServiceUser.prototype.__cleanUp = function(){
    ParentUser.prototype.__cleanUp.call(this);
  };
  ServiceUser.prototype._onSubServiceState = function(state,record){
    ParentUser.prototype._onSubServiceState.call(this,state,record);
    taskRegistry.run('readState',{
      sink:state.sink,
      stream:state,
      name:this.__service.satisfaction,
      cb:this.onSatisfaction.bind(this,state.sink)
    });
  };
  ServiceUser.prototype.onSatisfaction = function(sink,satisfaction){
    console.log('Satisfaction',satisfaction);
    if(satisfaction){
      sink.call('close').done(function(){
        console.log('close ok',arguments);
      },function(){
        console.error('close nok',arguments);
      });
    }
  };

  return ServiceUser;
}

module.exports = createServiceUser;
