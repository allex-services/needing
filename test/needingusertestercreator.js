function createNeedingUserTester(execlib,Tester){
  var lib = execlib.lib,
      q = lib.q;

  function NeedingUserTester(prophash,client){
    Tester.call(this,prophash,client);
    console.log('runNext finish');
    lib.runNext(this.finish.bind(this,0));
  }
  lib.inherit(NeedingUserTester,Tester);

  return NeedingUserTester;
}

module.exports = createNeedingUserTester;
