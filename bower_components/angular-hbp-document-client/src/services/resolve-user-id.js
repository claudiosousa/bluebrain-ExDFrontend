/**
 * @private
 * This factory is undocumented as it is meant for internal use only.
 * The API is subject to change without further notice.
 */
angular.module('hbpDocumentClient.core')
.factory('hbpDocumentClientResolveUserIds', function(hbpIdentityUserDirectory) {
  'use strict';

  return function(entites) {
     // Get the list of user's ids and try to find thier name
    var userIds = _.map(entites, '_createdBy');

    hbpIdentityUserDirectory.get(userIds).then(function (users) {
      for (var i = 0; i < entites.length; i++) {
        var user = users[entites[i]._createdBy];
        if (user) {
          entites[i]._createdByName = user.displayName;
        } else {
          // If no name was found for user we use it's id
          entites[i]._createdByName = entites[i]._createdBy;
        }
      }
    });
  };
});
