function createTasks(execlib) {
  'use strict';
  return [{
    name: 'consumeNeedingService',
    klass: require('./tasks/consumeneedingservice')(execlib)
  }];
}

module.exports = createTasks;
