function createNeedsCollection (lib, taskRegistry, coreslib) {
  'use strict';

  var q = lib.q,
    qlib = lib.qlib,
    shouldRun = true;

  function onShouldClose () {
    shouldRun = false;
  }
  lib.shouldClose.attach(onShouldClose);

  function objectSignature (obj) {
    var keys = Object.keys(obj).sort(), i, ret = '', key;
    for(i=0; i<keys.length; i++) {
      key = keys[i];
      if (!obj.hasOwnProperty(key)) continue;
      ret += (key+thingySignature(obj[key]));
    }
    return ret;
  }
  function thingySignature (obj) {
    if (obj == null) {
      return 'null';
    }
    switch(typeof obj) {
      case 'null':
        return 'null';
      case 'boolean':
      case 'number':
      case 'string':
            return obj;
      case 'object':
        return objectSignature(obj);
      case 'undefined':
      default:
          return '';
      }
  }

  function NeedRepresentation (consumer, need) {
    this.consumer = consumer;
    this.need = need;
    this.signature = thingySignature(need);
    this.handler = null;
    this.bidreceipt = null;
    this.issuerDestroyedListener = null;
  }
  NeedRepresentation.prototype.destroy = function () {
    this.purgeIssuerRelatedData();
    this.issuerDestroyedListener = null;
    this.bidreceipt = null;
    if (this.handler) {
      this.handler.destroy();
    }
    this.handler = null;
    this.signature = null;
    this.need = null;
    this.consumer = null;
  };
  NeedRepresentation.prototype.isBiddable = function () {
    if (!this.consumer) {
      return false;
    }
    return this.consumer.shouldServeNeed(this.need);
  };
  NeedRepresentation.prototype.ackIssuer = function (receipt) {
    this.purgeIssuerRelatedData();
    if (!(this.consumer && this.consumer.sink && this.consumer.sink.destroyed)) {
      return;
    }
    this.bidreceipt = receipt;
    this.issuerDestroyedListener = this.consumer.sink.destroyed.attach(this.purgeIssuerRelatedData.bind(this));
  };
  NeedRepresentation.prototype.purgeIssuerRelatedData = function () {
    if (this.issuerDestroyedListener) {
      this.issuerDestroyedListener.destroy();
    }
    this.issuerDestroyedListener = null;
    this.bidreceipt = null;
  };

  function NeedsCollection () {
    this.consumer = null;
    this.map = new lib.Map();
    this.jobs = new qlib.JobCollection();
    this.materializingTask = null;
  }
  NeedsCollection.prototype.destroy = function () {
    if (this.materializingTask) {
      this.materializingTask.destroy();
    }
    this.materializingTask = null;
    if (this.jobs) {
      this.jobs.destroy();
    }
    this.jobs = null;
    if (this.map) {
      lib.containerDestroyAll(this.map);
      this.map.destroy();
    }
    this.consumer = null;
  };
  NeedsCollection.prototype.setConsumer = function (consumer) {
    this.jobs.run('.', 
      qlib.newSteppedJobOnSteppedInstance(new coreslib.MethodInvocator(this, 'doSetConsumer', [consumer]))
    );
  };
  NeedsCollection.prototype.doSetConsumer = function (consumer) {
    //console.log('new consumer');
    this.unSetConsumer();
    this.consumer = consumer;
    if (!(this.consumer && this.consumer.sink && this.consumer.sink.destroyed)) {
      return;
    }
    this.consumer.sink.destroyed.attachForSingleShot(this.unSetConsumer.bind(this));
    taskRegistry.run('materializeQuery',{
      sink: this.consumer.sink,
      continuous: true,
      data: this.consumer.needs,
      onInitiated: this.initiate.bind(this),
      onNewRecord: this.newRecord.bind(this),
      onDelete: this.recordDeleted.bind(this)
    });
  };
  NeedsCollection.prototype.unSetConsumer = function () {
    this.consumer = null;
    if (this.materializingTask) {
      this.materializingTask.destroy();
    }
    this.materializingTask = null;
  }
  NeedsCollection.prototype.initiate = function (storage) {
    var data;
    if (!(this.consumer && this.consumer.shouldServeNeeds())) {
      return;
    }
    data = (!(storage && lib.isArray(storage.data))) ? [] : storage.data;
    //console.log('initiate with', data.length, 'needs');
    data.forEach(this.initiateNeed.bind(this));
    this.biddingCycle();
  };
  NeedsCollection.prototype.newRecord = function (rec) {
    //console.log('new Need', rec);
    this.initiateNeed(rec);
    this.biddingCycle();
  };
  NeedsCollection.prototype.recordDeleted = function (rec) {
    //console.log('need Down', rec);
    this.biddingCycle();
  };
  NeedsCollection.prototype.biddingCycle = function () {
    if (!shouldRun) {
      return q.reject(new lib.Error('PROCESS_IS_DONE'));
    }
    return qlib.newSteppedJobOnSteppedInstance(new coreslib.BidCycleMonitor(this)).go();
  };

  NeedsCollection.prototype.initiateNeed = function (need) {
    var rep = new NeedRepresentation(this.consumer, need), 
      existingrep = this.map.get(rep.signature);
    if (existingrep) {
      rep.destroy();
      this.offerResolution(existingrep);
      return;
    }
    this.map.add(rep.signature, rep);
  };

  NeedsCollection.prototype.offerResolution = function (representation) {
    console.log('should offer representation with', representation && representation.need ? representation.need : 'no need');
    representation.purgeIssuerRelatedData();
    this.biddingCycle();
  };

  NeedsCollection.prototype.firstBiddableFor = function (handler) {
    return this.jobs.run('.', qlib.newSteppedJobOnSteppedInstance(
      new coreslib.FirstInNeedsCollecton(this.map, handler)
    ))
  }

  return NeedsCollection;
}
module.exports = createNeedsCollection;