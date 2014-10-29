Angular HBP Common contains common web materials to support creation of
new websites.

Structure
=========

```
- src/
 `- assets/            // contains static assets sources
 `- scripts/           // AngularJS services, directives and controllers
 `- styles/            // Sass styles
- bower_components/  // Bower components
- dist/                // Distributed code
- styleguide-templates // Templates used by kss to generate the Styleguide
```

What's in /dist/ folder
=======================

- Styleguide: a set of HTML webpage that can be called the HBP styleguide
- angular-hbp-common.js: a set of common angular scripts grouped in the hbpCommon module
- hbp-common.css: Twitter Bootstrap and the rules describe in the styleguide

Development
===========

Clone the git repository:

```
git clone ssh://bbpcode.epfl.ch/platform/JSLibAngularHbpCommon
```

Start the development server using

```grunt serve```

Start sever against the compressed assets using

```grunt serve:dist```

Build using grunt

```grunt dist```

The code is run automatically by the watch task from the devel server. To
trigger test manually, run:

```grunt test```

You can publish the work using the following three commands:

```
npm run build
npm run test
npm run release
```

Updating the version
--------------------
To update the version, bump `bower.json`, the build will take care of spreading
the change.

Changelog
=========

[0.2.2] Fixed font for buttons in headers

[0.2.1]  Added: hbpDialogFactory.confirm(options)
         Deprecated: hbpDialogFactory.confirmation()
[0.2.0]  Use Bootstrap SASS 3.2.x which has a new directory structure.
