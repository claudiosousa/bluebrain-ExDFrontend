(function() {
    'use strict';

    angular.module('exdFrontendApp')
        .service('nrpModalService', ['$modal', function($modal) {
            var modal;
            return {
                createModal: createModal,
                destroyModal: destroyModal
            };

            /**
             * Creates a modal (UI dialog) object on top of the current view 
             * provided an html template. The templateUrl object must hold 
             * the Url itself, the scope, the closable option, and optionally 
             * parametes for the size and the css styling class. Example usage:
             * 
             *  var templateUrl = {
             *                      templateUrl: 'views/esv/robot-upload-dialog.html',
             *                      closable: true,
             *                      scope: $scope
             *                      windowClass: 'modal-window',
             *                      size:'lg'
             *                     };
             *  nrpModalService.createModal(templateUrl)
             *                 
             * @param  templateUrl an object containing the Url,the scope and 
             *                     the closable option for the modal
             */
            function createModal(templateUrl) {
                if (angular.isDefined(modal)) { modal.close(); }
                modal = $modal.open({
                    templateUrl: templateUrl.templateUrl,
                    show: true,
                    backdrop: 'static',
                    scope: templateUrl.scope,
                    keyboard: templateUrl.keyboard || templateUrl.closable,
                    windowClass: templateUrl.windowClass,
                    size: templateUrl.size
                });
            }

            /**
             * Destroys the modal object 
             */
            function destroyModal() {
                if (angular.isDefined(modal)) {
                    modal.close();
                    modal = undefined;
                }
            }

        }]);
}());