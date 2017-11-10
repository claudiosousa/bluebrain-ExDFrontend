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

  const MAX_VISIBLE_LINES = 200;
  const MAX_CMD_HISTORY = 100;
  const AUTO_SCROLL_MAX_DISTANCE = 50;

  const AVAILABLE_COMMANDS = {
    rostopic: 'Prints information about ROS Topics',
    rosservice: 'Prints information about ROS Services'
  };
  const HEADER_COMMAND = 'Enter "help" for more information.';
  const HELP_COMMAND = [
    'The ROS terminal is a shell where you can execute ROS commands.',
    'Supported commands: ',
    ..._.map(AVAILABLE_COMMANDS, (desc, key) => `\t${key}\t${desc}`),
    '',
    'Example: type "rostopic" to know more about this command'
  ];

  angular.module('rosTerminalModule').directive('rosTerminal', [
    '$timeout',
    '$document',
    'rosCommanderService',
    'editorToolbarService',
    ($timeout, $document, rosCommanderService, editorToolbarService) => {
      return {
        templateUrl: 'components/ros-terminal/ros-terminal.template.html',
        restrict: 'E',
        replace: true,
        scope: {
          ngShow: '=',
          close: '&closeFn'
        },
        link: (scope, $element) => {
          //initial command
          scope.commands = [{ type: 'response', data: HEADER_COMMAND }];

          const commandList = $element.find('.ros-command-list')[0];
          const rosCommandLine = $element.find('.ros-command-line');

          scope.cmdLine = '';
          scope.focused = true; //prompt should be focused
          scope.running = false; //we hide the prompt when a command is running

          scope.$watch('running', (before, after) => {
            if (before || !after || !scope.focused) return;
            // ros command just became enabled, maybe due to a cmd that has terminated, let's focus on it
            $timeout(() => rosCommandLine.focus());
          });

          let loadhistory = () => {
            try {
              let cmdHistory = localStorage.getItem('ROS_CMD_HISTORY');
              if (cmdHistory) return JSON.parse(cmdHistory);
            } catch (e) {
              angular.noop();
            }
            return ['help', 'rostopic']; //default cmd history
          };

          let cmdHistory = loadhistory();
          let cmdHistoryPos = 0; //not within history

          let addCmdToHistory = cmdLine => {
            cmdHistoryPos = 0;
            cmdHistory.push(cmdLine);
            cmdHistory.splice(0, cmdHistory.length - MAX_CMD_HISTORY);
            localStorage.setItem('ROS_CMD_HISTORY', JSON.stringify(cmdHistory));
          };

          let handleCommand = cmdLine => {
            addCmd({ type: 'cmd', data: cmdLine });
            scope.cmdLine = '';
            cmdLine = cmdLine.trim();

            addCmdToHistory(cmdLine);

            //split cmd line in cmd and args
            let [cmd, ...cmdArgs] = cmdLine.split(' ');

            if (AVAILABLE_COMMANDS[cmd]) {
              //is a valid command
              scope.running = true;
              rosCommanderService.sendCommand(cmd, cmdArgs);
            } else if (cmd === 'help') {
              //help command
              newResponsesReceived(HELP_COMMAND);
            } else {
              //unknow cmd
              addCmd({ type: 'error', data: `Unknown command '${cmd}'` });
            }
          };

          //add cmds to list of cmds to show, remove too old if len(cmds)>MAX_VISIBLE_LINES, and scroll if seing the last cmd
          let addCmd = cmds => {
            let shouldScroll =
              commandList.scrollHeight -
                (commandList.scrollTop + commandList.clientHeight) <
              AUTO_SCROLL_MAX_DISTANCE;

            if (!Array.isArray(cmds)) cmds = [cmds];
            scope.commands.push(...cmds);
            //remove extra cmds
            scope.commands.splice(0, scope.commands.length - MAX_VISIBLE_LINES);

            $timeout(() => {
              //set vertical scroll to bottom
              if (shouldScroll) {
                $timeout(
                  () => (commandList.scrollTop = commandList.scrollHeight)
                );
              }
            });
          };

          let newResponsesReceived = lines => {
            addCmd(lines.map(l => ({ type: 'response', data: l })));
          };

          let click$ = Rx.Observable
            .fromEvent($document, 'click')
            .subscribe(e => {
              //focus on prompt if click on terminal and not selecting text
              scope.focused =
                $element.is(e.target) || $element.has(e.target).length;

              if (scope.focused) {
                let textSelection = document.getSelection();

                if (
                  !textSelection ||
                  textSelection.type === 'Caret' ||
                  !textSelection.focusNode ||
                  !textSelection.focusNode.data ||
                  !$(textSelection.focusNode.parentNode).is(':visible')
                )
                  //we only focus if are NOT selecting text
                  rosCommandLine.focus();
              }
            });

          //submit on 'enter'
          let enterpress$ = Rx.Observable
            .fromEvent(rosCommandLine, 'keypress')
            .filter(e => e.which === 13) //enter key only
            .filter(() => rosCommandLine.val().trim()) //filter empty commands
            .subscribe(() => handleCommand(rosCommandLine.val()));

          //browse history using up/down keys
          let upDownPress$ = Rx.Observable
            .fromEvent(rosCommandLine, 'keydown')
            .filter(e => e.which == 38 || e.which == 40) // up | down
            .map(e => e.which == 38) // up ?
            .subscribe(up => {
              if (
                (!cmdHistoryPos && !up) ||
                (up && cmdHistoryPos == cmdHistory.length)
              ) {
                //already new cmd line, or top of history => nothing to do
                return;
              }

              if (cmdHistoryPos == 1 && !up) {
                //leaving history
                scope.cmdLine = '';
                cmdHistoryPos = 0;
                return;
              }

              // moving within history
              up ? cmdHistoryPos++ : cmdHistoryPos--;
              scope.cmdLine = cmdHistory[cmdHistory.length - cmdHistoryPos];

              $timeout(() =>
                //put caret at the end, after having applied the new value of scope.cmdLine
                rosCommandLine[0].setSelectionRange(
                  scope.cmdLine.length,
                  scope.cmdLine.length
                )
              );
            });

          //stop current execution on ctrl+c
          let ctrlC$ = Rx.Observable
            .fromEvent($document, 'keydown')
            .filter(e => e.which === 67 && e.ctrlKey) //ctrl+c only
            .subscribe(() => rosCommanderService.stopCurrentExecution());

          //new ros-response received
          let rosResponses$ = rosCommanderService.rosResponses$.subscribe(
            ([msg, running]) => {
              scope.running = running;
              newResponsesReceived(msg.data);
            }
          );

          scope.$on('$destroy', () => {
            click$.unsubscribe();
            enterpress$.unsubscribe();
            ctrlC$.unsubscribe();
            rosResponses$.unsubscribe();
            upDownPress$.unsubscribe();

            editorToolbarService.showRosTerminal = false;
          });
        }
      };
    }
  ]);
})();
