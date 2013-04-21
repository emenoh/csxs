/**
 * Copyright (c) 2013 Creative Market
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * @author Brian Reavis <brian@creativemarket.com>
 */

var fs     = require('fs');
var path   = require('path');
var spawn  = require('child_process').spawn;
var exec   = require('child_process').exec;


roto.addTarget('package', {
	description: 'Generates signed *.zxp installer ready for distribution.'
}, function(options) {
	var folder_build   = './build/bin-release';
	var folder_package = './package';

	// load project configuration to `config` global
	roto.addTask('csxs.config_load');

	// certificate settings
	roto.addTask(function(callback) {
		if (!config.certificate) {
			config.certificate = {
				location: '.certificate-self.p12',
				password: 'password'
			};
			if (!fs.existsSync(config.certificate.location)) {
				return roto.executeTask('target:certificate', {
					password : config.certificate.password,
					output   : config.certificate.location
				}, callback);
			}
		}
		callback();
	});

	// create temporary "package" directory
	roto.addTask('dir-remove', {path: folder_package});
	roto.addTask(function(callback) {
		fs.mkdir(folder_package, function() { callback(); });
	});

	// package extension (cs5)
	roto.addTask('target:compile', {'debug': false, 'cs-version': 5});
	roto.addTask('csxs.ucf', function() {
		return {
			input    : folder_build,
			output   : folder_package + '/CS5.zxp',
			keystore : config.certificate.location,
			password : config.certificate.password
		}
	});

	// package extension (cs6)
	roto.addTask('target:compile', {'debug': false, 'cs-version': 6});
	roto.addTask('csxs.ucf', function() {
		return {
			input    : folder_build,
			output   : folder_package + '/CS6.zxp',
			keystore : config.certificate.location,
			password : config.certificate.password
		}
	});

	// package hybrid extension
	roto.addTask('csxs.fs_copy', {from: 'assets/icon-mxi.png', to: folder_package + '/icon.png'});
	roto.addTask('csxs.fs_copy', function() {
		return {
			from     : config.basename + '.mxi',
			to       : folder_package + '/' + config.basename + '.mxi'
		};
	});
	roto.addTask('csxs.ucf', function() {
		return {
			input    : folder_package,
			output   : config.basename + '.' + config.version + '.zxp',
			keystore : config.certificate.location,
			password : config.certificate.password
		}
	});
	roto.addTask('csxs.fs_copy', function() {
		return {
			from     : config.basename + '.' + config.version + '.zxp',
			to       : config.basename + '.zxp'
		};
	});

});