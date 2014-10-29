/* jshint node: true, browser: false */
'use strict';

// var fs = require('fs');

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Define the configuration for all the tasks
  grunt.initConfig({
    pattern: {
      src: 'src/{,*/}*.js',
      templates: 'src/templates/*.html',
      test: 'test/unit/{,*/}*.js'
    },

    pkg: grunt.file.readJSON('bower.json'),

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            'dist/*',
            '!dist/.git*'
          ]
        }]
      },
      server: '.tmp'
    },

    concat: {
      dist: {
        src: [
          'src/*.js', // Load module first
          '.tmp/html2js/templates.js',
          '<%=pattern.src%>'
        ],
        dest: '.tmp/concat/angular-hbp-document-client.js'
      }
    },

    // ngmin tries to make the code safe for minification automatically by
    // using the Angular long form for dependency injection. It doesn't work on
    // things like resolve or inject so those have to be done manually.
    ngmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/concat',
          src: '*.js',
          dest: 'dist'
        }]
      }
    },

    uglify: {
      dist: {
        src: 'dist/angular-hbp-document-client.js',
        dest: 'dist/angular-hbp-document-client.min.js'
      }
    },

    sass: {
      options: {
        bundleExec: true,
        loadPath: [
          'src/styles/components',
          'bower_components'
        ]
      },
      dist: {
        files: {
          '.tmp/styles/angular-hbp-document-client.css': 'src/styles/angular-hbp-document-client.scss',
        }
      },
    },

    cssmin: {
      dist: {
        src: '.tmp/styles/angular-hbp-document-client.css',
        dest: 'dist/angular-hbp-document-client.min.css'
      }
    },

    wiredep: {
      example: {
        src: ['example/index.html']
      }
    },

    html2js: {
      options: {
        // custom options, see https://github.com/karlgoldstein/grunt-html2js
        base: 'src/',
        module: 'hbpDocumentClientTemplates'
      },
      main: {
        src: ['<%=pattern.templates%>'],
        dest: '.tmp/html2js/templates.js'
      },
    },

    jshint: {
      options: {
        reporter: require('jshint-stylish')
      },
      src: {
        src: ['<%=pattern.src%>', 'Gruntfile.js'],
        options: {
          jshintrc: '.jshintrc'
        }
      },
      test: {
        src: ['test/**/*.js'],
        options: {
          jshintrc: 'test/.jshintrc'
        }
      }
    },

    copy: {
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/styles',
          dest: 'dist',
          src: ['*.*']
        }, {
          expand: true,
          cwd: 'src/styles',
          dest: 'dist/scss',
          src: ['**/*.*']
        }]
      }
    },

    connect: {
      options: {
        port: 3002,
        hostname: '0.0.0.0'
      },
      watch: {
        options: {
          open: true,
          useAvailablePort: true,
          base: 'example',
          livereload: 30020,
          middleware: function(connect) {
            return [
              connect.static('./example'),
              connect.static('./.tmp'),
              connect().use(
                '/src',
                connect.static('./src')
              ),
              connect().use(
                '/bower_components',
                connect.static('./bower_components')
              )
            ];
          }
        }
      }
    },

    karma: {
      options: {
        files: require('wiredep')({devDependencies: true}).js.concat([
          'src/*.js',
          '<%=pattern.src%>',
          '.tmp/html2js/templates.js',
          'test/support/{,*/}*.js',
          'test/unit/{,*/}*.js'
        ]),
        reporters: ['progress']
      },
      unit: {
        options: {
          preprocessors: {
            // source files, that you want to generate coverage for
            // do not include tests or libraries
            // (these files will be instrumented by Istanbul)
            'src/{,*/}*.js': ['coverage']
          },
          reporters: ['progress', 'junit', 'coverage']
        },
        configFile: 'test/karma.conf.js'
      },
      watch: {
        configFile: 'test/karma.conf.js',
        background: true,
        singleRun: false
      },
      dist: {
        options: {
          files: require('wiredep')({devDependencies: true}).js.concat([
            'dist/angular-hbp-document-client.min.js',
            'test/support/{,*/}*.js',
            'test/unit/{,*/}*.js'
          ]),
          reporters: ['progress', 'junit'],
          junitReporter: {
            outputFile: 'reports/dist-unit-test.xml',
            suite: 'unit'
          },
        },
        configFile: 'test/karma.conf.js'
      }
    },

    bump: {
      options: {
        files: ['package.json', 'bower.json'],
        updateConfigs: ['pkg'],
        commit: true,
        commitMessage: '[grunt-bump] bump to %VERSION%',
        commitFiles: ['package.json', 'bower.json'],
        push: true,
        pushTo: 'origin HEAD:master',
        createTag: false
      }
    },
    gitcommit: {
      dist: {
        options: {
          message: 'built artefact',
          ignoreEmpty: true,
          force: true
        },
        files: {
          src: ['dist/**/*']
        },
      }
    },
    gittag: {
      dist: {
        options: {
          tag: '<%=pkg.version%>',
          message: 'Version <%=pkg.version%> release'
        }
      }
    },
    gitpush: {
      dist: {
        options: {
          tags: true
        }
      }
    },

    watch: {
      sass: {
        files: ['src/styles/**/*.scss'],
        tasks: ['sass'] // copy:dist will be called later by watch:css
      },
      css: {
        files: ['.tmp/styles/*.css'],
        tasks: ['cssmin', 'copy:dist'],
        options: {
          livereload: '<%= connect.watch.options.livereload %>'
        }
      },
      js: {
        files: ['<%=pattern.src%>'],
        tasks: ['concat', 'ngmin', 'uglify']
      },
      jshint: {
        files: [
          '<%=pattern.src%>',
          '<%=pattern.test%>',
          'test/karma.conf.js',
          'Gruntfile.js'
        ],
        tasks: ['newer:jshint:src', 'newer:jshint:test']
      },
      livereload: {
        files: [
          '<%=pattern.src%>',
          '.tmp/html2j/templates.js',
          'example/*.*'
        ],
        options: {
          livereload: '<%= connect.watch.options.livereload %>'
        }
      },
      karma: {
        files: [
          '<%=pattern.src%>',
          '<%=pattern.test%>',
          'test/karma.conf.js',
          '.tmp/html2js/templates.js'
        ],
        tasks: ['karma:watch:run']
      },
      html2js: {
        files: ['<%=pattern.templates%>'],
        tasks: ['html2js']
      }
    },

    jsdoc: {
      dist: {
        options: {
          configure: '.jsdoc'
        },
        src: ['<%=pattern.src%>', 'README.md'],
        dest: '.tmp/apidoc'
      }
    },

    compress: {
      doc: {
        options: {
          mode: 'zip',
          archive: '.tmp/apidoc.zip'
        },
        files: [{
          expand: true,
          cwd: '.tmp/apidoc',
          src: ['**']
        }]
      }
    }
  });


  grunt.registerTask('publishDoc', function() {
    var request = require('request');
    var bowerConfig = grunt.file.readJSON('./bower.json');
    var fs = require('fs');
    var path = require('path');

    var done = this.async();

    grunt.log.writeln('publish documentation');
    var r = request.post('http://bbpsrv27.epfl.ch:5000/docs/hmd', function(err, res) {
      if(err || res.statusCode !== 200) {
        grunt.fail.warn('Unable to publish documentation', err);
        return done(false);
      }
      grunt.log.writeln('documentation published');
      done();
    });
    var form = r.form();
    form.append('name', bowerConfig.name);
    form.append('description', bowerConfig.description);
    form.append('version', bowerConfig.version.match(/^[0-9]+\.[0-9]+/)[0]);
    form.append('filedata', fs.createReadStream(path.join(__dirname, '.tmp', 'apidoc.zip')));
  });

  grunt.registerTask('bowerRegister', function(){
    var request = require('request');
    var bowerConfig = grunt.file.readJSON('./bower.json');
    var baseUrl = grunt.file.readJSON('./.bowerrc').registry;

    var done = this.async();

    var registerComponent = function(done) {
      grunt.log.writeln('Send registration request');
      if (! (bowerConfig && bowerConfig.repository && bowerConfig.repository.url)) {
        grunt.fail.warn('Missing repository.url key in bower.json');
        done(false);
      }
      request.post(baseUrl+'/packages/', {
        form: {
          name: bowerConfig.name,
          url: bowerConfig.repository.url
        }
      }, function(error, response){
        if (response.statusCode !== 201) {
          grunt.fail.warn('Registration failed:' + response.statusCode + ' - ' + error);
          done(false);
        } else {
          grunt.log.writeln('registration successful');
          done();
        }
      });
    };

    request.get(baseUrl+'/packages/'+bowerConfig.name, function(error, response) {
      if (error || response.statusCode !== 200) {
        registerComponent(done);
      } else {
        grunt.log.writeln('already registered');
        done();
      }
    });
  });

  grunt.registerTask('ci', 'Run all the build steps on the CI server', function (target) {

    // Junit reporter for JShint
    grunt.config('jshint.src.options.reporter', require('jshint-junit-reporter'));
    grunt.config('jshint.src.options.reporterOutput', 'reports/jshint-src-unit.xml');
    grunt.config('jshint.test.options.reporter', require('jshint-junit-reporter'));
    grunt.config('jshint.test.options.reporterOutput', 'reports/jshint-test-unit.xml');


    var tasks = ['wiredep', 'test', 'build', 'jsdoc', 'karma:dist'];
    if (target === 'patch' || target === 'minor' || target === 'major') {
      tasks.unshift('bump:'+target);

      tasks.push('compress:doc');
      tasks.push('publishDoc');

      tasks.push('gitcommit:dist');
      tasks.push('gittag:dist');
      tasks.push('gitpush:dist');

      tasks.push('bowerRegister');
    }
    grunt.task.run(tasks);
  });

  grunt.registerTask('serve', 'Watch for change and refresh example application', [
    'clean:dist',
    'build',
    'connect:watch',
    'karma:watch',
    'watch'
  ]);
  grunt.registerTask('test', 'Run code quality tools',
    ['html2js', 'jshint', 'karma:unit']);
  grunt.registerTask('build', 'Build the code in dist folder',
    ['html2js', 'sass', 'cssmin', 'concat', 'ngmin', 'uglify', 'copy:dist']);
  grunt.registerTask('default', 'clean, build, test',
    ['clean:dist', 'build', 'test']);
};
