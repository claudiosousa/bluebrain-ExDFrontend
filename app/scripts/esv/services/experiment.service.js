/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 * ---LICENSE-END **/

(function ()
{
  'use strict';

  /**
   * @ngdoc service
   * @namespace exdFrontendApp.services
   * @module experimentModule
   * @name experimentModule.experimentService
   * @description Service that manage experiment informations
   */
  class ExperimentService
  {
    constructor(simulationInfo,
               simulationControl, userContextService, bbpConfig,experimentsFactory,
               nrpFrontendVersion,
               nrpBackendVersions)
    {
      simulationControl(simulationInfo.serverBaseUrl).simulation({ sim_id: simulationInfo.simulationID }, (data) =>
      {
        userContextService.ownerID = data.owner;
        this.experimentConfiguration = data.experimentConfiguration;
        this.environmentConfiguration = data.environmentConfiguration;
        this.creationDate = data.creationDate;

        this.experimentDescription = simulationInfo.experimentDetails.description;
        this.experimentName = simulationInfo.experimentDetails.name;

        this.rosTopics = bbpConfig.get('ros-topics');
        this.rosbridgeWebsocketUrl = simulationInfo.serverConfig.rosbridge.websocket;

        if (!bbpConfig.get('localmode.forceuser', false))
        {
          experimentsFactory.getOwnerDisplayName(data.owner).then((owner)=>
          {
            this.owner = owner;
          });
        }
        else
        {
          this.owner = bbpConfig.get('localmode.ownerID');
          userContextService.ownerID = this.owner;
        }
      });

      this.versionString = '';
      nrpFrontendVersion.get((data)=>
      {
        this.versionString += data.toString;
      });

      nrpBackendVersions(simulationInfo.serverBaseUrl).get((data)=>
      {
        this.versionString += data.toString;
      });
    }
  }

  angular.module('experimentModule', ['userContextModule', 'nrpBackendAbout'])
    .factory('experimentService', ['simulationInfo', 'simulationControl',
                                    'userContextService','bbpConfig',
                                   'experimentsFactory','nrpFrontendVersion','nrpBackendVersions',
     (...args) => new ExperimentService(...args)]);

} ());
