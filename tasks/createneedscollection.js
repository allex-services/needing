function createCreateNeedsCollection (execlib, coreslib) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    execSuite = execlib.execSuite,
    Task = execSuite.Task,
    taskRegistry = execSuite.taskRegistry,
    NeedsCollection = require('./helpers/needscollectioncreator')(lib, taskRegistry, coreslib);

  function CreateNeedsCollectionTask(prophash) {
    Task.call(this, prophash);
    this.stateObject = prophash.stateObject;
  }
  lib.inherit(CreateNeedsCollectionTask, Task);
  CreateNeedsCollectionTask.prototype.go = function () {
    this.stateObject.state = new NeedsCollection();
    this.destroy();
  };

  CreateNeedsCollectionTask.prototype.compulsoryConstructionProperties = ['stateObject'];

  return CreateNeedsCollectionTask;
}
module.exports = createCreateNeedsCollection;