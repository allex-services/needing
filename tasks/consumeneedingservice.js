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
    this.serveNeedFailed = prophash.serveNeedFailed;
    if(prophash.identityForNeed){
      this.identityForNeed = prophash.identityForNeed;
    }
    if(prophash.bidForNeed){
      this.bidForNeed = prophash.bidForNeed;
    }
    this.respondToChallenge = prophash.respondToChallenge;
    this.needs = [];
    this.alreadymaterializing = false;
    this.startIndex = 0;
  }
  lib.inherit(NeedingServiceConsumer,SinkTask);
  NeedingServiceConsumer.prototype.__cleanUp = function(){
    console.log('consumeNeedingService dead');
    if(!this.needs){
      return;
    }
    this.startIndex = null;
    this.alreadymaterializing = null;
    this.needs = null;
    this.respondToChallenge = null;
    this.bidForNeed = null;
    this.identityForNeed = null;
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
    var nl, i, need;
    if(!this.needs){
      return;
    }
    this.log('serveNeeds?',this.needs);
    if(!this.shouldServeNeeds()){
      this.log('Cannot start serving needs at all');
      return;
    }
    nl = this.needs.length;
    if(nl>this.startIndex){
      for (i=this.startIndex; i<nl; i++) {
        need = this.needs[i];
        if (this.isNeedBiddable(need)) {
          break;
        }
        need = null;
      }
      if(!need){
        this.log('No more needs to bid on');
        return;
      }
      this.produceNeed(need);
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
      this.onCannotSubConnect.bind(this, need.instancename)
    );
  };
  NeedingServiceConsumer.prototype.doBid = function(need,bidobj,needsink){
    this.log('doBid',need,needsink);
    taskRegistry.run('doBidCycle',{
      sink:needsink,
      bidobject:bidobj,
      challengeProducer:this.onChallenge.bind(this,need),
      cb:this.onBidCycleSucceeded.bind(this),
      errorcb: this.onBidCycleFailed.bind(this)
    });
  };
  NeedingServiceConsumer.prototype.isNeedBiddable = function(need){
    var ssn = this.shouldServeNeed(need);
    if(ssn){
      if('function' === typeof ssn.done){
        ssn.done(this.serveNeeds.bind(this));
        return false;
      }
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
  NeedingServiceConsumer.prototype.onBidCycleSucceeded = function () {
    this.startIndex = 0;
  };
  NeedingServiceConsumer.prototype.onBidCycleFailed = function () {
    this.serveNeedFailed();
    this.startIndex++;
    this.serveNeeds();
  };
  NeedingServiceConsumer.prototype.onCannotSubConnect = function (instancename){
    console.error('cannot subConnect to Need',instancename,arguments);
    instancename = null;
    this.serveNeeds();
  };
  NeedingServiceConsumer.prototype.compulsoryConstructionProperties = ['sink','shouldServeNeeds','shouldServeNeed','serveNeedFailed'];
  return NeedingServiceConsumer;
}

module.exports = createConsumeNeedingService;
