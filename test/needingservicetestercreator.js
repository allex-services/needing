function createNeedingServiceTester(execlib,Tester){
  var lib = execlib.lib,
      q = lib.q;

  function NeedingServiceTester(prophash,client){
    Tester.call(this,prophash,client);
    console.log('runNext finish');
    lib.runNext(this.finish.bind(this,0));
  }
  lib.inherit(NeedingServiceTester,Tester);

  return NeedingServiceTester;
}

module.exports = createNeedingServiceTester;
