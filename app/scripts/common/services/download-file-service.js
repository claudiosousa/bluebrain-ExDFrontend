(function () {
    'use strict';

    angular.module('exdFrontendApp')
        .service('downloadFileService', [function () {

            return {
                downloadFile: downloadFile
            };

            function downloadFile(href, fileName) {
                var link = document.createElement('a');
                document.body.appendChild(link);
                link.style.display = 'none';
                link.download = fileName;
                link.href = href;
                link.click();
                document.body.removeChild(link);
            }
        }]);

} ());
