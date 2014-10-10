// Generated on 2014-05-14 using generator-angular 0.8.0
'use strict';

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

        // Project settings
        yeoman: {
            // configurable paths
            app: require('./bower.json').appPath || 'app',
            dist: 'dist'
        },

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            js: {
                files: ['*.js'],
                tasks: ['newer:jshint:all']
            },
            jsTest: {
                files: ['test/spec/{,*/}*.js'],
                tasks: ['newer:jshint:test', 'karma']
            },
            gruntfile: {
                files: ['Gruntfile.js']
            }
        },

        // The actual grunt server settings
        connect: {
            options: {
                port: 9000,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                livereload: 35729
            },
            test: {
                options: {
                    port: 9001,
                    base: [
                        '.tmp',
                        'test',
                        '<%= yeoman.app %>'
                    ]
                }
            }
        },

        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                'Gruntfile.js',
                '{,*/}*.js'
            ],
            test: {
                options: {
                    jshintrc: 'test/.jshintrc'
                },
                src: ['test/spec/{,*/}*.js']
            }
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= yeoman.dist %>/*',
                        '!<%= yeoman.dist %>/.git*'
                    ]
                }]
            },
            server: '.tmp'
        },

        // Test settings
        karma: {
            unit: {
                configFile: 'karma.conf.js',
                singleRun: true
            }
        },

        release: {
            options: {
                file: 'bower.json',
                bump: false, // until jenkins can commit on master branch.
                commit: false,
                push: false,
                npm: false
            }
        },

        gitcommit: {
            dist: {
                options: {
                    message: 'built artefact',
                    ignoreEmpty: true
                },
                files: {
                    src: 'angular-bbp-config.js'
                },
            }
        }
    });

    grunt.registerTask('register', function(){
        var request = require('request');
        var bowerConfig = grunt.file.readJSON('./bower.json');
        var baseUrl = grunt.file.readJSON('./.bowerrc').registry;

        var done = this.async();

        var registerComponent = function(done) {
            grunt.log.writeln('Send registration request');
            if (! (bowerConfig && bowerConfig.repository && bowerConfig.repository.url)) {
                grunt.log.error('Missing repository.url key in bower.json');
                done(false);
            }
            request.post(baseUrl+'/packages/', {
                form: {
                    name: bowerConfig.name,
                    url: bowerConfig.repository.url
                }
            }, function(error, response) {
                if (response.statusCode !== 201) {
                    grunt.log.error('Registration failed:' + response.statusCode + ' - ' + error);
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

    grunt.registerTask('serve', function (target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'test',
            'watch'
        ]);
    });

    grunt.registerTask('server', function (target) {
        grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
        grunt.task.run(['serve:' + target]);
    });

    grunt.registerTask('test', [
        'clean:server',
        'jshint',
        'karma'
    ]);

    grunt.registerTask('build', []);
    grunt.registerTask('publish', ['gitcommit:dist', 'release', 'register']);
    grunt.registerTask('default', ['test']);
};
