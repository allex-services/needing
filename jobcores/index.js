function createJobCores (execlib) {
  'use strict';

  var lib = execlib.lib,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  var mylib = {};

  require('./methodinvocatorcreator')(lib, mylib);

  require('./firstinarrycreator')(lib, mylib);
  require('./firstinmapcreator')(lib, mylib);
  require('./firstinneedscollectioncreator')(lib, mylib);
  require('./bidcyclecreator')(lib, taskRegistry, mylib);
  require('./bidcyclemonitorcreator')(lib, mylib);

  return mylib;
}
module.exports = createJobCores;