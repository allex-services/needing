function createTasks(execlib) {
  'use strict';
  var coreslib = require('./jobcores')(execlib);
  return [{
    name: 'createNeedsCollection',
    klass: require('./tasks/createneedscollection')(execlib, coreslib)
  },{
    name: 'consumeNeedingService',
    klass: require('./tasks/consumeneedingservice')(execlib, coreslib)
  }];
}

module.exports = createTasks;
