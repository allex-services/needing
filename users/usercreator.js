function createUser(execlib,ParentUser){
  'use strict';

  if(!ParentUser){
    ParentUser = execlib.execSuite.ServicePack.Service.prototype.userFactory.get('user');
  }

  function User(prophash){
    ParentUser.call(this,prophash);
  }
  ParentUser.inherit(User,require('../methoddescriptors/user'),[],require('../visiblefields/user'));
  User.prototype.__cleanUp = function(){
    ParentUser.prototype.__cleanUp.call(this);
  };

  return User;
}

module.exports = createUser;
