var execlib=require('hers_exectesting')();

execlib.test({
  debug_brk: false,
  debug: false,
  name:'Needing',
  modulepath:'./index.js',
  propertyhash: {
  }
},{
  debug_brk: false,
  debug: false,
  tests:[
  {
    count:2,
    role: 'service',
    tester:{
      count:2,
      modulepath:'./test/needingservicetestercreator',
      propertyhash:{
      }
    }
  },
  {
    count:2,
    role: 'user',
    tester:{
      count:2,
      modulepath:'./test/needingusertestercreator',
      propertyhash:{
      }
    }
  } 
  ]
});

