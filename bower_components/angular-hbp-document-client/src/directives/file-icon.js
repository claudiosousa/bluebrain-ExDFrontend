(function() {
  'use strict';

  angular.module('hbpDocumentClient.ui')

  /**
   * @namespace hbpFileIcon
   * @desc
   * hbp-file-icon directive represents the icon corresponding to an entity type.
   *
   * It's possible to provide the type as a string (attribute: `type`)
   * or an entity object (attribute: `entity`) having a property named `_entityType`.
   *
   * admitted values for type/_entityType:
   * * root
   * * project
   * * folder
   * * file
   * * release
   * * link:folder
   * * link:file
   * * link:project
   * * link:release
   *
   * @memberof hbpDocumentClient.ui
   * @example
   * <div ng-controller="iconController">
   *     this is the icon for a {{entity._entityType}}: <hbp-file-icon entity="entity"></hbp-file-icon><br/>
   *     this is the icon for a: {{type}} <hbp-icon type="type"></hbp-icon>
   * </div>
   */
  .directive('hbpFileIcon', hbpFileIcon);

  ///////////////////////

  function hbpFileIcon() {
    return {
      templateUrl: 'templates/file-icon.html',
      restrict: 'E',
      scope: {
        entity: '=?',
        type: '=?'
      },
      link: function(scope) {
        if (!scope.type && scope.entity) {
          scope.type = scope.entity._entityType;
        }
      }
    };
  }
}());
