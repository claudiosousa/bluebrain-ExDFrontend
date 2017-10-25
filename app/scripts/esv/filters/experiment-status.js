/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
 * https://www.humanbrainproject.eu
 *
 * The Human Brain Project is a European Commission funded project
 * in the frame of the Horizon2020 FET Flagship plan.
 * http://ec.europa.eu/programmes/horizon2020/en/h2020-section/fet-flagships
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
 * ---LICENSE-END**/
(function() {
  'use strict';

  let getStatus = (experiment, clusterAvailability, minAvailable) => {
    if (
      !experiment.availableServers ||
      experiment.availableServers.length === 0
    )
      return 2;
    else if (clusterAvailability && clusterAvailability.free > minAvailable)
      return 0;
    return 1;
  };

  angular
    .module('exdFrontendFilters')
    .filter('experimentStatus', [
      'CLUSTER_THRESHOLDS',
      CLUSTER_THRESHOLDS => (experiment, clusterAvailability) => {
        const STATUS_LABELS = {
          0: `Available.`,
          1: `Restricted.`,
          2: `Unavailable.`
        };

        let status =
          STATUS_LABELS[
            getStatus(
              experiment,
              clusterAvailability,
              CLUSTER_THRESHOLDS.AVAILABLE
            )
          ];
        let clusterInfo = `Cluster availability: `;
        clusterInfo += clusterAvailability
          ? `${clusterAvailability.free}/${clusterAvailability.total}.`
          : `No information available.`;
        let backendInfo = `Backends: ${experiment.availableServers
          ? experiment.availableServers.length
          : 'No information available.'}`;

        return `${status}
${clusterInfo}
${backendInfo}`;
      }
    ])
    .filter('experimentStatusClass', [
      'CLUSTER_THRESHOLDS',
      CLUSTER_THRESHOLDS => (experiment, clusterAvailability) => {
        const STATUS_CLASS = {
          0: `label-success`,
          1: `label-warning`,
          2: `label-danger`
        };

        return STATUS_CLASS[
          getStatus(
            experiment,
            clusterAvailability,
            CLUSTER_THRESHOLDS.AVAILABLE
          )
        ];
      }
    ]);
})();
