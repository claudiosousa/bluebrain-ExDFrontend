(function ()
{
  'use strict';

  angular.module('exdFrontendApp').service('simulationConfigService',
    ['$resource', 'simulationInfo', 'serverError', '$q', 'collabFolderAPIService', '$http',
      function ($resource, simulationInfo, serverError, $q, collabFolderAPIService, $http)
      {
        return {
          doesConfigFileExist: doesConfigFileExist,
          loadConfigFile: loadConfigFile,
          saveConfigFile: saveConfigFile,
        };

        //-------------------------------------------------------
        // Get file from collab if available, if not try to get it directly from backend

        function doesConfigFileExist(configType)
        {
          return getBackendConfigFileNames(configType).then(function (response)
          {
            return !!response;
          });
        }

        function loadConfigFile(configType)
        {
          return getBackendConfigFileNames(configType).then(function (response)
          {
            if (response)
            {
              if (simulationInfo.contextID)
              {
                return collabFolderAPIService.getExperimentFolderId(simulationInfo.contextID)
                  .then(function (folderId)
                  {


                    var filename = response.file.substr(response.file.lastIndexOf('/') + 1);

                    return collabFolderAPIService.getFolderFile(folderId, filename)
                      .then(function (fileData)
                      {
                        if (fileData)
                        {
                          return collabFolderAPIService.downloadFile(fileData._uuid)
                            .then(function (fileContent)
                            {
                              if (fileContent)
                              {
                                return fileContent;
                              }
                              else
                              {
                                return getBackendConfigFile(response.file);
                              }
                            });
                        }
                        else
                        {
                          return getBackendConfigFile(response.file);
                        }
                      });
                  });
              }
              else
              {
                return getBackendConfigFile(response.file);
              }
            }

            return $q.reject();
          });
        }

        function saveConfigFile(configType, data)
        {
          if (simulationInfo.isCollabExperiment && simulationInfo.contextID)  // A config file can be saved only in collab mode
          {

            collabFolderAPIService.getExperimentFolderId(simulationInfo.contextID).then(function (folderId)
            {
              if (folderId)
              {
                return getBackendConfigFileNames(configType).then(function (response)
                {
                  if (response)
                  {

                    var filename = response.file.substr(response.file.lastIndexOf('/') + 1);

                    collabFolderAPIService.getFolderFile(folderId, filename)
                      .then(function (fileData)
                      {
                        if (fileData)
                        {
                          // File exists

                          collabFolderAPIService.deleteFile(folderId, filename)
                            .then(function (result)
                            {
                              if (result)
                              {
                                collabFolderAPIService.createFolderFile(folderId, filename, data).then(
                                  function (result)
                                  {
                                    return result;
                                  });
                              }
                            });
                        }
                        else
                        {
                          collabFolderAPIService.createFolderFile(folderId, filename, data).then(
                            function (result)
                            {
                              return result;
                            }
                          );
                        }
                      });
                  }
                });
              }
            });
          }
        }

        //-------------------------------------------------------
        // Direct backend access functions

        function getBackendConfigFileNames(configType)
        {
          return $resource(simulationInfo.serverBaseUrl + '/simulation/:sim_id/resources', {}, {
            get: {
              method: 'GET',
              interceptor: { responseError: serverError.displayHTTPError }
            }
          }).get({ sim_id: simulationInfo.simulationID }).$promise
            .then(function (response)
            {
              return response && response.resources && _.find(response.resources, function (r) { return r.type === configType; });
            });
        }

        function getBackendConfigFile(configFileName)
        {
          return $http({
            url: simulationInfo.serverBaseUrl + configFileName,
            method: 'GET',
            transformResponse: function (value)
            {
              return value;
            }
          }).then(function (response)
          {
            return response && response.data;
          });
        }
      }
    ]);
} ());
