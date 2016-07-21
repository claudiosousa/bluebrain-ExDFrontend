// the API retrieve object using underscore names, authorize.
/*jshint camelcase:false*/

/**
 * @namespace hbpFileStore
 * @desc
 * The `hbpFileStore` service deal with file entity type.
 *
 * @see Entity format: https://services-dev.humanbrainproject.eu/document/v0/ui/#!/entity/get_entity_get_0
 * @memberof hbpDocumentClient.core
 */
angular.module('hbpDocumentClient.core')
.provider('hbpFileStore', function() {
  'use strict';

  // Return a good enough mimetype
  var fixMimeType = function(file) {
    // Best match are found by the browser
    if (file.type) {
      return file.type;
    }

    var extension = file.name.match(/\.([a-z0-9]+)$/);
    if (!extension) {
      return;
    }
    extension = extension[1];
    // ipynb is not an official mime-type
    if (extension.match(/^(j|i)pynb$/)) {
      return 'application/x-ipynb+json';
    }
    // In worst case, return a dummy value that is consistent
    // for a given file extension and valid from the point of view
    // of the specification.
    return 'application/x-' + extension;
  };

  return {
    $get: function($http, $q, $log, bbpConfig, hbpEntityStore, hbpErrorService) {
      var maxFileSize = bbpConfig.get('hbpFileStore.maxFileUploadSize', 10*1024*1024);

      var hbpFileStore = {};
      var baseUrl = bbpConfig.get('api.document.v0');

      var error = function(cause, options) {
        options = options || {};
        var name = 'UploadError';

        var err = new Error(name+': '+cause+' '+options.message);
        err.cause = cause;
        err.statusText = options.message;
        err.name = name;
        err.file = options.file;
        err.entity = options.entity;
        return err;
      };

      var abortError = function() {
        return error('Aborted');
      };


      var entityUrl = function(entity) {
        return baseUrl+'/'+entity._entityType.split(':')[0]+'/'+entity._uuid;
      };

      var deleteEntity = function(entity) {
        return $http.delete(entityUrl(entity));
      };

      var uploadFile = function(file, entity, config) {
        var d = $q.defer();
        $http.post(entityUrl(entity)+'/content/upload', file, angular.extend({
            headers: {
              'Content-Type': 'application/octet-stream'
            }
          }, config)
          ).success(function(entity) {
            d.notify({
              lengthComputable: true,
              total: file.size,
              loaded: file.size
            });
            d.resolve(entity);
          }).error(function(err, status) {
            var uploadError = function() {
              if (!err || status === 0) {
                return abortError();
              } else {
                return error('UploadError', {
                  message: err.message,
                  file: file,
                  entity: entity
                });
              }
            };
            deleteEntity(entity).then(function() {
              d.reject(uploadError(err));
            }, function(deleteErr) {
              $log.error('Unable to remove previously created entity', deleteErr);
              d.reject(uploadError(err));
            });
          });
        return d.promise;
      };

      /**
       * Create file entity and upload the content of the given file.
       *
       * `options` should contain a `parent` key containing the parent entity.
       *
       * Possible error causes:
       *
       * - FileTooBig
       * - UploadError - generic error for content upload requests
       * - EntityCreationError - generic error for entity creation requests
       * - FileAlreadyExistError
       *
       * @function
       * @memberof hbpDocumentClient.core.hbpFileStore
       * @param {File} file The file descriptor to upload
       * @param {Object} options The list of options
       * @return {Promise} a Promise that notify about progress and resolve
       *   with the new entity object.
       * @memberof hbpDocumentClient.core.hbpFileStore
       */
      hbpFileStore.upload = function(file, options) {
        options = options || {};
        var d = $q.defer();
        var dAbort = $q.defer();

        d.promise.abort = function() {
          dAbort.resolve();
        };

        if (file.size > maxFileSize) {
          d.reject(error('FileTooBig', {
            message: 'The file `'+file.name+'` is too big('+file.size+' bytes), max file size is '+maxFileSize+' bytes.'
          }));
          return d.promise;
        }

        var entityOpts = {
          _contentType: fixMimeType(file)
        };
        hbpEntityStore.create('file', options.parent && options.parent._uuid, file.name, entityOpts)
        .then(function(entity) {
          d.notify({
            lengthComputable: true,
            total: file.size,
            loaded: 0
          });

          uploadFile(file, entity, {
            timeout: dAbort.promise,
            uploadProgress: function(event) {
              d.notify(event);
            }
          }).then(
            function(entity) {
              d.promise.abort = function() {
                deleteEntity(entity);
                dAbort.resolve();
              };
              d.resolve(entity);
            },
            d.reject,
            d.notify
          );

        }, d.reject);

        return d.promise;
      };

      /**
       * Ask for a short-lived presigned URL to be generated to download a file
       *
       * Deprecated in favor of requestDownloadUrl(entity). Will be removed as
       * of version 1.0.0
       *
       * @function
       * @memberof hbpDocumentClient.core.hbpFileStore
       */
      hbpFileStore.requestSignedUrl = function (id) {
        $log.debug('hbpFileStore.requestSignedUrl(id) is deprecated, use hbpFileStore.downloadUrl(entityOrId) instead');
        return $http.get(baseUrl+'/' + 'file/' + id + '/content/secure_link').then(function(response) {
          return response.data;
        });
      };

      /**
       * hbpFileStore. downloadUrl(entity) method asynchronously ask for a
       * short-lived, presigned URL that can be used to access and
       * download a file without authentication.
       *
       * This method is a replacement for requestSignedUrl which retrieve an
       * object containing a partial URL.
       *
       * @function
       * @memberof hbpDocumentClient.core.hbpFileStore
       */
      hbpFileStore.downloadUrl = function (entity) {
        var id = entity._uuid || entity;
        return $http.get(baseUrl+'/' + 'file/' + id + '/content/secure_link')
        .then(function(response) {
          return baseUrl + response.data.signed_url;
        }, function(err) {
          return $q.reject(hbpErrorService.httpError(err));
        });
      };

      /**
       * Retrieves the content of a file given its id.
       *
       * @function
       * @memberof module:hbpFileStor
       */
      hbpFileStore.getContent = function (id, customConfig) {
        var config = {
          method: 'GET',
          url: baseUrl+'/' + 'file/' + id + '/content',
          transformResponse: function(data) { return data; }
        };
        if (angular.isDefined(customConfig)){
          angular.extend(config, customConfig);
        }
        return $http(config).then(function(data) {
          return data.data;
        });
      };

      /**
       * Retrieve the max upload file size in bytes.
       *
       * @function
       * @memberof hbpDocumentClient.core.hbpFileStore
       */
      hbpFileStore.maxFileSize = function() {
        return maxFileSize;
      };

      return hbpFileStore;
    }
  };
});
