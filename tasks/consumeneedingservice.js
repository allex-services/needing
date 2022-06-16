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
    this.collection = prophash.needsCollection;//new NeedsCollection(this);
    this.startIndex = 0;
  }
  lib.inherit(NeedingServiceConsumer,SinkTask);
  NeedingServiceConsumer.prototype.__cleanUp = function(){
    console.log('consumeNeedingService dead');
    if(!this.needs){
      return;
    }
    this.startIndex = null;
    if (this.collection) {
      this.collection.destroy();
    }
    this.collection = null;
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
    this.collection.setConsumer(this);
  };
  
  NeedingServiceConsumer.prototype.compulsoryConstructionProperties = ['sink','shouldServeNeeds','shouldServeNeed','serveNeedFailed','needsCollection'];
  return NeedingServiceConsumer;
}

module.exports = createConsumeNeedingService;
