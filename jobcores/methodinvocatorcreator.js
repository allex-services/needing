function createMethodInvocatorJobCore (lib, mylib) {
  'use strict';

  function MethodInvocatorJobCore (instance, methodname, args) {
    this.instance = instance;
    this.methodname = methodname;
    this.args = args;
  }
  MethodInvocatorJobCore.prototype.destroy = function () {
    this.args = null;
    this.methodname = null;
    this.instance = null;
  };
  MethodInvocatorJobCore.prototype.shouldContinue = function () {
    if (!this.instance) {
      return new lib.Error('NO_INSTANCE_FOR_INVOCATION');
    }
    if (!lib.isString(this.methodname)) {
      return new lib.Error('NO_METHODNAME_FOR_INVOCATION');
    }
    if (!lib.isArray(this.args)) {
      return new lib.Error('ARGUMENTS_FOR_INVOCATION_NOT_AN_ARRY');
    }
  };
  MethodInvocatorJobCore.prototype.invoke = function () {
    return this.instance[this.methodname].apply(this.instance, this.args);
  };

  MethodInvocatorJobCore.prototype.steps = [
    'invoke'
  ];

  mylib.MethodInvocator = MethodInvocatorJobCore;
}
module.exports = createMethodInvocatorJobCore;