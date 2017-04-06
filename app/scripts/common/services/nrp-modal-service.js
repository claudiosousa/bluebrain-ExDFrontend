(function () {
    'use strict';

    angular.module('exdFrontendApp')
        .service('nrpModalService', ['$modal', function ($modal) {
            var modal;
            return {
                createModal: createModal,
                destroyModal: destroyModal
            };

            /**
             * Creates a modal (UI dialog) object on top of the current view
             * The templateUrl object must hold the html template Url itself, 
             * the scope, the closable option and, optionally, parameters 
             * for the size and the css styling class. Example usage:
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

                return modal.result.finally((function (destModal) {
                    return function () { destroyModal(destModal); };
                })(modal));
            }

            /**
             * Destroys the modal object
             */
            function destroyModal(destModal) {
                destModal = destModal || modal;
                if (angular.isDefined(destModal)) {
                    destModal.close();
                    if (destModal === modal) {
                        modal = undefined;
                    }
                }
            }

        }]);
}());