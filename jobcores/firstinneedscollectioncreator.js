function createFirstInNeedsCollectionJobCore (lib, mylib) {
  'use strict';

  var qlib = lib.qlib;

  var FirstInMapJobCore = mylib.FirstInMap;

  function FindBiddableNeedWithHandlerAttachJobCore (needrepresentation, handler) {
    this.needrepresentation = needrepresentation;
    this.handler = handler;
    this.giveup = false;
  }
  FindBiddableNeedWithHandlerAttachJobCore.prototype.destroy = function () {
    this.giveup = null;
    this.handler = null;
    this.needrepresentation = null;
  };
  FindBiddableNeedWithHandlerAttachJobCore.prototype.shouldContinue = function () {
    if (!this.needrepresentation) {
      return new lib.Error('NO_NEED_TO_CHECK_FOR_BIDDABLE');
    }
  };
  FindBiddableNeedWithHandlerAttachJobCore.prototype.checkHandler = function () {
    return this.needrepresentation.handler;
  };
  FindBiddableNeedWithHandlerAttachJobCore.prototype.onCheckHandler = function (handler) {
    /*
    if (handler) {
      console.log(this.needrepresentation.need.instancename, 'has handler, giveup');
      console.log(handler);
    }
    */
    this.giveup = !!handler;
  };
  FindBiddableNeedWithHandlerAttachJobCore.prototype.checkIssuer = function () {
    return this.needrepresentation.bidreceipt;
  };
  FindBiddableNeedWithHandlerAttachJobCore.prototype.onIssuer = function (bidticket) {
    if (this.giveup) {
      return;
    }
    this.giveup = !!bidticket;
  };
  FindBiddableNeedWithHandlerAttachJobCore.prototype.checkBiddable = function () {
    if (this.giveup) {
      return false;
    }
    return this.needrepresentation.isBiddable();
  };
  FindBiddableNeedWithHandlerAttachJobCore.prototype.onCheckBiddable = function (biddable) {
    if (this.giveup) {
      return false;
    }
    /*
    if (!biddable) {
      console.log(this.needrepresentation.need.instancename, 'is not biddable');
    }
    */
    this.giveup = !biddable;
  };
  FindBiddableNeedWithHandlerAttachJobCore.prototype.finalize = function () {
    if (this.giveup) {
      return null;
    }
    this.needrepresentation.handler = this.handler;
    return this.needrepresentation;
  };

  FindBiddableNeedWithHandlerAttachJobCore.prototype.steps = [
    'checkHandler',
    'onCheckHandler',
    'checkIssuer',
    'onIssuer',
    'checkBiddable',
    'onCheckBiddable',
    'finalize'
  ];

  function FirstInNeedsCollectonJobCore (map, handler) {
    FirstInMapJobCore.call(this, map);
    this.handler = handler;
  }
  lib.inherit(FirstInNeedsCollectonJobCore, FirstInMapJobCore);
  FirstInNeedsCollectonJobCore.prototype.destroy = function () {
    this.handler = null;
    FirstInMapJobCore.prototype.destroy.call(this);
  };
  FirstInNeedsCollectonJobCore.prototype.processMapItem = function (item) {
    return qlib.newSteppedJobOnSteppedInstance(
      new FindBiddableNeedWithHandlerAttachJobCore(item, this.handler)
    ).go();
  };

  mylib.FirstInNeedsCollecton = FirstInNeedsCollectonJobCore;
}
module.exports = createFirstInNeedsCollectionJobCore;