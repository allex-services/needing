function createConsumeNeedingService(execlib){
  'use strict';
  var lib = execlib.lib,
      q = lib.q,
      qlib = lib.qlib,
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
    if(!this.needs){
      return;
    }
    this.log('serveNeeds?',this.needs);
    if(!this.shouldServeNeeds()){
      this.log('Cannot start serving needs at all');
      return;
    }
    this.biddingCycle();
  };
  NeedingServiceConsumer.prototype.biddingCycle = function () {
    this.findBiddableNeed().done(this.onBiddableNeed.bind(this)); //findBiddableNeed must not reject
  };
  NeedingServiceConsumer.prototype.findBiddableNeed = function (index) {
    if (!this.needs) {
      return q(null);
    }
    var nl, need;
    index = lib.isNumber(index) ? index : 0;
    nl = this.needs.length;
    if (index>nl) {
      return q(null);
    }
    if(nl>this.startIndex){
      need = this.needs[index];
      var ret = qlib.thenableRead(this.isNeedBiddable(need)).then(
        this.onNeedBiddable.bind(this, need, index),
        this.onNeedBiddableFail
      );
      need = null;
      index = null;
      return ret;
    }else{
      this.log('No more needs');
      return q(null);
    }
  };
  NeedingServiceConsumer.prototype.onNeedBiddable = function (need, index, isbid) {
    if (isbid) {
      var ret = need;
      need = null;
      return ret;
    }
    return this.onNeedBiddableFail(index, null);
  };
  NeedingServiceConsumer.prototype.onNeedBiddableFail = function (index, reason_ignored) {
    var ret = this.findBiddableNeed(index+1);
    index = null;
    return ret;
  };
  NeedingServiceConsumer.prototype.onBiddableNeed = function (need) {
    if(!need){
      this.log('No more needs to bid on');
      return;
    }
    this.produceNeed(need);
    this.biddingCycle();
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
      this.onCannotSubConnect.bind(this, need)
    );
  };
  NeedingServiceConsumer.prototype.doBid = function(need,bidobj,needsink){
    this.log('doBid',need,needsink);
    taskRegistry.run('doBidCycle',{
      sink:needsink,
      bidobject:bidobj,
      challengeProducer:this.onChallenge.bind(this,need),
      cb:this.onBidCycleSucceeded.bind(this),
      errorcb: this.onBidCycleFailed.bind(this, need)
    });
  };
  NeedingServiceConsumer.prototype.isNeedBiddable = function(need){
    return this.shouldServeNeed(need);
  };
  NeedingServiceConsumer.prototype.onChallenge = function(need,challenge,defer){
    this.respondToChallenge(need,challenge,defer);
    need = null;
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
  NeedingServiceConsumer.prototype.onBidCycleFailed = function (need) {
    this.serveNeedFailed(need);
    this.startIndex++;
    this.serveNeeds();
    need = null;
  };
  NeedingServiceConsumer.prototype.onCannotSubConnect = function (need){
    //console.error('cannot subConnect to Need',need.instancename,arguments);
    this.serveNeedFailed(need);
    this.serveNeeds();
    need = null;
  };
  NeedingServiceConsumer.prototype.compulsoryConstructionProperties = ['sink','shouldServeNeeds','shouldServeNeed','serveNeedFailed'];
  return NeedingServiceConsumer;
}

module.exports = createConsumeNeedingService;
