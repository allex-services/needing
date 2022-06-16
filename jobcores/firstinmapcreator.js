function createFirstInMapJobCore (lib, mylib) {
  'use strict';

  var FirstInArryJobCore = mylib.FirstInArry;

  function FirstInMapJobCore (map) {
    FirstInArryJobCore.call(this, map.keys());
    this.map = map;
  }
  lib.inherit(FirstInMapJobCore, FirstInArryJobCore);
  FirstInMapJobCore.prototype.destroy = function () {
    this.map = null;
    FirstInArryJobCore.prototype.destroy.call(this);
  };

  FirstInMapJobCore.prototype.processArryItem = function (key) {
    return this.processMapItem(this.map.get(key));
  };

  FirstInMapJobCore.prototype.processMapItem = function (item) {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' must implement processMapItem');
  };

  mylib.FirstInMap = FirstInMapJobCore;
}
module.exports = createFirstInMapJobCore;