/**
 * @namespace core
 * @desc
 * hbpDocumentClient.Core Module
 *
 * The core module of hbpDocumentClient provides angular factories to deal
 * with various storage entities {hbpEntityStore}.
 *
 * It also provides specialized factory to accomplish task related
 * to certain specific kind of entities:
 *
 * - {hbpFileStore} to create, upload and edit file entities
 * - {hbpFolderStore} to create, upload and edit folder entities
 * - {hbpProjectStore} to create, upload and edit project entities
 *
 * @memberof hbpDocumentClient
 */
angular.module('hbpDocumentClient.core', ['bbpConfig', 'hbpCommon']);

/**
 * @namespace ui
 * @desc
 * hbpDocumentClient.UI Module
 *
 * The ui module of hbpDocumentClient provides Angular directives to commonly
 * used storage related viewers like {hbpFileBrowser}, {hbpFileMiniBrowser},
 * and {hbpFileIcon}.
 *
 * @memberof hbpDocumentClient
 */
angular.module('hbpDocumentClient.ui', ['bbpConfig', 'hbpCommon', 'hbpDocumentClientTemplates', 'hbpDocumentClient.core']);

/**
 * @namespace hbpDocumentClient
 * @desc
 * hbpDocumentClient Module
 *
 * This module is the default one, advertised in the README file. It loads
 * both hbpDocumentClient.core and hbpDocumentClient.ui.
 */
angular.module('hbpDocumentClient', ['hbpDocumentClient.core', 'hbpDocumentClient.ui']);
