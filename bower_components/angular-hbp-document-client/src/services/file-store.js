// the API retrieve object using underscore names, authorize.
/*jshint camelcase:false*/

/**
 * The `hbpFileStore` service deal with file entity type.
 *
 * @module hbpFileStore
 * @see Entity format: https://services-dev.humanbrainproject.eu/document/v0/ui/#!/entity/get_entity_get_0
 */
angular.module('hbpDocumentClient')
.provider('hbpFileStore', function() {
  'use strict';

  return {
    $get: ['$http', '$q', '$log', 'bbpConfig',
      function($http, $q, $log, bbpConfig) {
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

        var createEntity = function(type, options, config) {
          var d = $q.defer();
          $http.post(
            baseUrl+'/'+type.split(':')[0],
            options,
            config
          )
          .success(function(entity) {
            d.resolve(entity);
          })
          .error(function(serviceError, status) {
            var err;
            options = {
              message: serviceError && serviceError.reason
            };
            if (status === 0) {
              err = abortError();
            } else if (serviceError.reason.match(/already exists/)) {
              err = error('FileAlreadyExistError', options);
            } else {
              err  = error('EntityCreationError', options);
            }
            d.reject(err);
          });
          return d.promise;
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
                if (status === 0) {
                  return abortError();
                } else {
                  return error('UploadError', {
                    message: err.reason,
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
         * @memberof module:hbpFileStore
         * @param {File} file The file descriptor to upload
         * @param {Object} options The list of options
         * @return {Promise} a Promise that notify about progress and resolve
         *   with the new entity object.
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
            _parent: options.parent && options.parent._uuid,
            _name: file.name,
            _contentType: file.type,
          };
          createEntity('file', entityOpts).then(function(entity) {
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
         * @function
         * @memberof module:hbpFileStore
         */
        hbpFileStore.requestSignedUrl = function (id) {
          return $http.get(baseUrl+'/' + 'file/' + id + '/content/secure_link').then(function(response) {
            return response.data;
          });
        };

        /**
         * Retrieves the content of a file given its id.
         *
         * @function
         * @memberof module:hbpFileStor
         */
        hbpFileStore.getContent = function (id) {
          return $http({
            method: 'GET',
            url: baseUrl+'/' + 'file/' + id + '/content',
            transformResponse: function(data) { return data; }
          }).then(function(data) {
            return data.data;
          });
        };

        /**
         * Retrieve the max upload file size in bytes.
         *
         * @function
         * @memberof module:hbpFileStore
         */
        hbpFileStore.maxFileSize = function() {
          return maxFileSize;
        };

        return hbpFileStore;
      }
    ]
  };
});
