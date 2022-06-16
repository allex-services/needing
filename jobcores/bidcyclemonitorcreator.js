function createBidCycleMonitorJobCore (lib, mylib) {
  'use strict';

  var qlib = lib.qlib;

  function BidCycleMonitorJobCore (collection) {
    this.collection = collection;
    this.cycleNeed = null;
  }
  BidCycleMonitorJobCore.prototype.destroy = function () {
    this.cycleNeed = null;
    this.collection = null;
  }
  BidCycleMonitorJobCore.prototype.shouldContinue = function () {
    if (!this.collection) {
      return new lib.Error('NO_COLLECTION_FOR_BIDCYCLE_MONITOR');
    }
    if (!this.collection.consumer) {
      return new lib.Error('COLLECTION_FOR_BIDCYCLE_MONITOR_DESTROYED');
    }
  };
  BidCycleMonitorJobCore.prototype.init = function () {
    var ret = qlib.newSteppedJobOnSteppedInstance(new mylib.BidCycle(this.collection)).go();
    return ret.then(
      this.onBiddingCycleSuccess.bind(this),
      this.onBiddingCycleFail.bind(this),
      this.onBiddingCycleProgress.bind(this)
    );
    //return qlib.promise2console(ret, 'bidcycle');
  };

  BidCycleMonitorJobCore.prototype.onBiddingCycleSuccess = function (res) {
    return res;
  };
  BidCycleMonitorJobCore.prototype.onBiddingCycleFail = function (reason) {
    //console.log('biddingCycle error', reason ? (reason.code || reason.message) : 'none', 'got cycleNeed', this.cycleNeed);
    if (this.cycleNeed) {
      try {
        this.collection.consumer.serveNeedFailed(this.cycleNeed);
      } catch (e) {
        console.error('error in onServeNeedFailed', e);
      }
    }
    lib.runNext(this.collection.biddingCycle.bind(this.collection), lib.intervals.Second);
    throw reason;
  };
  BidCycleMonitorJobCore.prototype.onBiddingCycleProgress = function (progress) {
    if (progress && progress.need) {
      this.cycleNeed = progress.need;
    }
  };

  BidCycleMonitorJobCore.prototype.steps = [
    'init'
  ];

  mylib.BidCycleMonitor = BidCycleMonitorJobCore;
}
module.exports = createBidCycleMonitorJobCore;