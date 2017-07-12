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

  class EditorToolbarService {

    constructor(dynamicViewOverlayService, DYNAMIC_VIEW_CHANNELS) {
      this.showBrainvisualizerPanel = false;
      this.showLogConsole = false;
      this.showEnvironmentSettingsPanel = false;
      this.showSpikeTrain = false;
      this.showNavigationModeMenu = false;
      this.videoStreamsAvailable = false;
      this.dynamicViewOverlayService = dynamicViewOverlayService;
      this.DYNAMIC_VIEW_CHANNELS = DYNAMIC_VIEW_CHANNELS;
    }

    get isBrainVisualizerActive()
    {
      return this.showBrainvisualizerPanel;
    }

    get isLogConsoleActive()
    {
      return this.showLogConsole;
    }

    get isEnvironmentSettingsPanelActive()
    {
      return this.showEnvironmentSettingsPanel;
    }

    get isSpikeTrainActive()
    {
      return this.showSpikeTrain;
    }

    get isNavigationModeMenuActive()
    {
      return this.showNavigationModeMenu;
    }

    toggleLogConsole() {
      this.dynamicViewOverlayService.isOverlayOpen(this.DYNAMIC_VIEW_CHANNELS.LOG_CONSOLE).then(state => {
        this.showLogConsole = !state;
        if(state) {
          this.dynamicViewOverlayService.closeAllOverlaysOfType(this.DYNAMIC_VIEW_CHANNELS.LOG_CONSOLE);
        } else {
          this.dynamicViewOverlayService.createDynamicOverlay(this.DYNAMIC_VIEW_CHANNELS.LOG_CONSOLE);
        }
      });
    }

    toggleBrainvisualizer() {
      this.dynamicViewOverlayService.isOverlayOpen(this.DYNAMIC_VIEW_CHANNELS.BRAIN_VISUALIZER).then(state => {
        this.showBrainvisualizerPanel = !state;
        if(state) {
          this.dynamicViewOverlayService.closeAllOverlaysOfType(this.DYNAMIC_VIEW_CHANNELS.BRAIN_VISUALIZER);
        } else {
          this.dynamicViewOverlayService.createDynamicOverlay(this.DYNAMIC_VIEW_CHANNELS.BRAIN_VISUALIZER);
        }
      });
    }

    toggleSpikeTrain() {
      this.dynamicViewOverlayService.isOverlayOpen(this.DYNAMIC_VIEW_CHANNELS.SPIKE_TRAIN).then(state => {
        this.showSpikeTrain = !state;
        if(state) {
          this.dynamicViewOverlayService.closeAllOverlaysOfType(this.DYNAMIC_VIEW_CHANNELS.SPIKE_TRAIN);
        } else {
          this.dynamicViewOverlayService.createDynamicOverlay(this.DYNAMIC_VIEW_CHANNELS.SPIKE_TRAIN);
        }
      });
    }
  }

  angular.module('editorToolbarModule')
  .service('editorToolbarService', ['dynamicViewOverlayService', 'DYNAMIC_VIEW_CHANNELS',
    (...args) => new EditorToolbarService(...args)]);

}());
