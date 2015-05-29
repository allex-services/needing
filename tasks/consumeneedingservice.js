function createConsumeNeedingService(execlib){
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
  }
  lib.inherit(NeedingServiceConsumer,SinkTask);
  NeedingServiceConsumer.prototype.__cleanUp = function(){
    if(!this.needs){
      return;
    }
    this.needs = null;
    this.shouldServeNeed = null;
    this.shouldServeNeeds = null;
    this.sink = null;
    SinkTask.prototype.__cleanUp.call(this);
  };
  NeedingServiceConsumer.prototype.go = function(){
    taskRegistry.run('materializeData',{
      sink: this.sink,
      data: this.needs,
      onInitiated: this.serveNeeds.bind(this),
      onNewRecord: this.serveNeeds.bind(this),
      onDelete: this.serveNeeds.bind(this),
    });
  };
  NeedingServiceConsumer.prototype.checkNeeds = function(){
    var d = q.defer();
    d.then(this.serveNeeds.bind(this));
  };
  NeedingServiceConsumer.prototype.serveNeeds = function(){
    console.log('serveNeeds?',this.needs);
    if(!this.shouldServeNeeds()){
      this.log('Cannot start serving needs at all');
      return;
    }
    this.log('serveNeeds?');
    if(this.needs.length){
      var needobj = {need:null};
      this.needs.some(this.isNeedBiddable.bind(this,needobj));
      if(!needobj.need){
        this.log('No more needs to bid on');
        return;
      }
      this.serveNeed(needobj.need);
    }else{
      this.log('No more needs');
    }
  };
  NeedingServiceConsumer.prototype.serveNeed = function(need){
    this.log('serving need',need);
    this.sink.subConnect(need.instancename,this.identityForNeed(need),{}).done(
      this.doBid.bind(this,need),
      function(){
        console.error('cannot subConnect to Need',need.instancename,arguments);
      }
    );
  };
  NeedingServiceConsumer.prototype.doBid = function(need,needsink){
    this.log('doBid',need,needsink);
    taskRegistry.run('doBidCycle',{
      sink:needsink,
      bidobject:{},
      challengeProducer:this.onChallenge.bind(this,need),
      cb:lib.dummyFunc //there's nothing to do on successful challenge response
    });
  };
  NeedingServiceConsumer.prototype.isNeedBiddable = function(needobj,need){
    var ssn = this.shouldServeNeed(need);
    if(ssn){
      if(ssn.done){
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
  NeedingServiceConsumer.prototype.bidForNeed = function(need){
    return {};
  };
  NeedingServiceConsumer.prototype.compulsoryConstructionProperties = ['sink','shouldServeNeeds','shouldServeNeed'];
  return NeedingServiceConsumer;
}

module.exports = createConsumeNeedingService;
