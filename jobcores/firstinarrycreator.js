function createFirstInArrayJobCore (lib, mylib) {
  'use strict';

  function FirstInArryJobCore (arry) {
    this.arry = arry;
    this.index = -1;
    this.over = false;
  }
  FirstInArryJobCore.prototype.destroy = function () {
    this.over = null;
    this.index = null;
    this.arry = null;
  }
  FirstInArryJobCore.prototype.init = function () {
    if (!lib.isArray(this.arry)) {
      throw new lib.Error('NOT_AN_ARRAY');
    }
  };
  FirstInArryJobCore.prototype.doOneStep = function () {
    if (!lib.isNumber(this.index)) {
      throw new lib.Error('NOT_A_NUMBER');
    }
    this.index++;    
    if (this.index >= this.arry.length) {
      this.over = true;
      return null;
    }
    return this.processArryItem(this.arry[this.index]).then(
      this.onOneStep.bind(this)
    );
  };
  FirstInArryJobCore.prototype.onOneStep = function (res) {
    if (res) {
      return res;
    }
    if (this.over) {
      return null;
    }
    return this.doOneStep();
  };

  FirstInArryJobCore.prototype.processArryItem = function (item) {
    throw new lib.Error('NOT_IMPLEMENTED', this.constructor.name+' must implement processOne');
  };

  FirstInArryJobCore.prototype.steps = [
    'init',
    'doOneStep'
  ];

  mylib.FirstInArry = FirstInArryJobCore;
}
module.exports = createFirstInArrayJobCore;