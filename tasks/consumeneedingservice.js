function createConsumeNeedingService(execlib){
  'use strict';
  var lib = execlib.lib,
      q = lib.q,
      execSuite = execlib.execSuite,
      SinkTask = execSuite.SinkTask,
      taskRegistry = execSuite.taskRegistry;

  function NeedingServiceConsumer(prophash){
    SinkTask.call(this,prophash);
    this.sink = prophash.sink;
    this.shouldServeNeeds = prophash.shouldServeNeeds;
    this.shouldServeNeed = prophash.shouldServeNeed;
    if(prophash.identityForNeed){
      this.identityForNeed = prophash.identityForNeed;
    }
    if(prophash.bidForNeed){
      this.bidForNeed = prophash.bidForNeed;
    }
    this.respondToChallenge = prophash.respondToChallenge;
    this.needs = [];
    this.alreadymaterializing = false;
  }
  lib.inherit(NeedingServiceConsumer,SinkTask);
  NeedingServiceConsumer.prototype.__cleanUp = function(){
    if(!this.needs){
      return;
    }
    this.alreadymaterializing = null;
    this.needs = null;
    this.shouldServeNeed = null;
    this.shouldServeNeeds = null;
    this.sink = null;
    SinkTask.prototype.__cleanUp.call(this);
  };
  NeedingServiceConsumer.prototype.go = function(){
    if(this.alreadymaterializing){
      return;
    }
    this.alreadymaterializing = true;
    taskRegistry.run('materializeQuery',{
      sink: this.sink,
      continuous: true,
      data: this.needs,
      onInitiated: this.serveNeeds.bind(this),
      onNewRecord: this.serveNeeds.bind(this),
      onDelete: this.serveNeeds.bind(this),
    });
  };
  NeedingServiceConsumer.prototype.serveNeeds = function(){
    if(!this.needs){
      return;
    }
    this.log('serveNeeds?',this.needs);
    if(!this.shouldServeNeeds()){
      this.log('Cannot start serving needs at all');
      return;
    }
    if(this.needs.length){
      var needobj = {need:null};
      this.needs.some(this.isNeedBiddable.bind(this,needobj));
      if(!needobj.need){
        this.log('No more needs to bid on');
        return;
      }
      this.produceNeed(needobj.need);
    }else{
      this.log('No more needs');
    }
  };
  NeedingServiceConsumer.prototype.produceNeed = function(need){
    var d = q.defer();
    this.bidForNeed(need,d);
    d.promise.done(this.serveNeed.bind(this,need));
  };
  NeedingServiceConsumer.prototype.serveNeed = function(need,bidobj){
    this.log('serving need',need);
    this.sink.subConnect(need.instancename,this.identityForNeed(need),{}).done(
      this.doBid.bind(this,need,bidobj),
      function(){
        console.error('cannot subConnect to Need',need.instancename,arguments);
      }
    );
  };
  NeedingServiceConsumer.prototype.doBid = function(need,bidobj,needsink){
    this.log('doBid',need,needsink);
    taskRegistry.run('doBidCycle',{
      sink:needsink,
      bidobject:bidobj,
      challengeProducer:this.onChallenge.bind(this,need),
      cb:lib.dummyFunc //there's nothing to do on successful challenge response
    });
  };
  NeedingServiceConsumer.prototype.isNeedBiddable = function(needobj,need){
    var ssn = this.shouldServeNeed(need);
    if(ssn){
      if('function' === typeof ssn.done){
        ssn.done(this.serveNeeds.bind(this));
        return false;
      }
      needobj.need = need;
      return true;
    }
  };
  NeedingServiceConsumer.prototype.onChallenge = function(need,challenge,defer){
    this.respondToChallenge(need,challenge,defer);
  };
  NeedingServiceConsumer.prototype.identityForNeed = function(need){
    return {};
  };
  NeedingServiceConsumer.prototype.bidForNeed = function(need,defer){
    this.log('bidForNeed?',need,defer);
    defer.resolve({});
  };
  NeedingServiceConsumer.prototype.compulsoryConstructionProperties = ['sink','shouldServeNeeds','shouldServeNeed'];
  return NeedingServiceConsumer;
}

module.exports = createConsumeNeedingService;
