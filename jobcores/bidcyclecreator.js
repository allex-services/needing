function createBidCycleJobCore (lib, taskRegistry, mylib) {
  'use strict';

  var q = lib.q,
    qlib = lib.qlib;

  function BidCycleJobCore (collection) {
    this.notify = new lib.HookCollection();
    this.collection = collection;
    this.biddablerepresentation = null;
    this.bid = null;
    this.subSink = null;
    this.bidDefer = null;
    this.bidResult = null;
  }
  BidCycleJobCore.prototype.destroy = function () {
    this.bidResult = null;
    this.bidDefer = null;
    if (this.subSink) {
      this.subSink.destroy();
    }
    this.subSink = null;
    this.bid = null;
    if (this.biddablerepresentation) {
      this.biddablerepresentation.handler = null;
    }
    this.biddablerepresentation = null;
    this.collection = null;
    if (this.notify) {
      this.notify.destroy();
    }
    this.notify = null;
  };
  BidCycleJobCore.prototype.shouldContinue = function () {
    if (!this.collection) {
      return new lib.Error('NO_NEEDS_COLLECTION');
    }
    if (!this.collection.consumer) {
      return new lib.Error('NEEDS_COLLECTION_ALREADY_DESTROYED');
    }
    if (!this.collection.consumer.sink) {
      return new lib.Error('NEEDS_CONSUMER_NOT_CONNECTED');
    }
  };
  BidCycleJobCore.prototype.findBiddableNeed = function () {
    return this.collection.firstBiddableFor(this);
  };
  BidCycleJobCore.prototype.onBiddableNeed = function (needrepresentation) {
    //console.log('got biddable need', need);
    if (!needrepresentation) {
      //console.log('no biddable need');
      return null;
    }
    this.biddablerepresentation = needrepresentation;
    this.notify.fire({need: this.biddablerepresentation.need});
    this.collection.biddingCycle();
  };
  BidCycleJobCore.prototype.produceBid = function () {
    var d, ret;
    if (!this.biddablerepresentation) {
      return null;
    }
    d = q.defer();
    ret = d.promise;
    this.collection.consumer.bidForNeed(this.biddablerepresentation.need, d);
    return ret;
  };
  BidCycleJobCore.prototype.onBidProduced = function (bid) {
    this.bid = bid;
  };
  BidCycleJobCore.prototype.subConnect = function () {
    if (!this.biddablerepresentation) {
      return 'nothing';
    }
    return this.collection.consumer.sink.subConnect(
      this.biddablerepresentation.need.instancename,
      this.collection.consumer.identityForNeed(this.biddablerepresentation.need),
      {}
    )
  };
  BidCycleJobCore.prototype.onSubConnected = function (sink) {
    if (!sink) {
      throw new lib.Error('COULD_NOT_SUBCONNECT', 'Could not subConnect as '+his.collection.consumer.identityForNeed(this.biddablerepresentation));
    }
    if (sink == 'nothing') {
      return;
    }
    this.subSink = sink;
  };
  BidCycleJobCore.prototype.doBid = function () {
    var ret;
    if (!this.subSink) {
      return null;
    }
    this.bidDefer = q.defer();
    ret = this.bidDefer.promise;
    taskRegistry.run('doBidCycle',{
      sink:this.subSink,
      bidobject:this.bid,
      challengeProducer:this.onChallenge.bind(this),
      cb:this.onBidCycleSucceeded.bind(this),
      errorcb: this.onBidCycleFailed.bind(this),
      instancename: this.biddablerepresentation.need.instancename
    });
    return ret;
  };
  BidCycleJobCore.prototype.onChallenge = function (challenge,defer) {
    var err = this.shouldContinue();
    if (err) {
      defer.reject(err);
      return;
    }
    this.collection.consumer.respondToChallenge(this.biddablerepresentation.need,challenge,defer);
  };
  BidCycleJobCore.prototype.onBidCycleSucceeded = function (res) {
    if (!this.bidDefer) {
      console.log('bidCycle succeeded', res, 'but no bidDefer?', this);
      return;
    }
    this.bidDefer.resolve(res);
  };
  BidCycleJobCore.prototype.onBidCycleFailed = function (reason) {
    if (!this.bidDefer) {
      console.log('bidCycle failed', reason, 'but no bidDefer?', this);
      return;
    }
    this.bidDefer.reject(reason);
  };
  BidCycleJobCore.prototype.onBidDone = function (res) {
    if (this.biddablerepresentation) {
      this.biddablerepresentation.ackIssuer(res);
    }
    return res;
  };

  BidCycleJobCore.prototype.steps = [
    'findBiddableNeed',
    'onBiddableNeed',
    'produceBid',
    'onBidProduced',
    'subConnect',
    'onSubConnected',
    'doBid',
    'onBidDone'
  ]

  mylib.BidCycle = BidCycleJobCore;
}
module.exports = createBidCycleJobCore;