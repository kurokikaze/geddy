/*
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

var sys = require('sys');
//var child_process = require('child_process');
var fs = require('fs');

exports.tasks = {
  'default': {
    'desc': 'Installs the Geddy Web-app development framework',
    'deps': [],
    'task': function (env) {
      var cmds = [
        'mkdir -p ~/.node_libraries',
        'cp -R ./dist/* ~/.node_libraries/',
        'cp geddy-core/scripts/geddy-gen /usr/local/bin/',
        'cp geddy-core/scripts/geddy /usr/local/bin/'
      ];
      runCmds(cmds, function () {
        sys.puts('Geddy installed.');
      });
    }
  },

  'app': {
    'desc': 'Creates a new Geddy app scaffold.',
    'deps': [],
    'task': function (env) {
      var dir = env.firstArg;
      var cmds = [
        'mkdir -p ./' + dir,
        'mkdir -p ./' + dir + '/config',
        'mkdir -p ./' + dir + '/app/models',
        'mkdir -p ./' + dir + '/app/controllers',
        'mkdir -p ./' + dir + '/app/views',
        'mkdir -p ./' + dir + '/public',
        'cp ~/.node_libraries/geddy-core/scripts/gen/router.js ' + dir + '/config/',
        'cp ~/.node_libraries/geddy-core/scripts/gen/config.js ' + dir + '/config/',
        'cp ~/.node_libraries/geddy-core/scripts/gen/main.js ' + dir + '/app/controllers/',
        'cp ~/.node_libraries/geddy-core/scripts/gen/application.js ' + dir + '/app/controllers/'
      ]
      runCmds(cmds, function () {
        sys.puts('Created app ' + dir + '.');
      });
    }
  },
  
  'resource': {
    'desc': '',
    'deps': [],
    'task': function (env) {
      var text;
      var filePath;
      var fleegix = require('../lib/fleegix');
      
      // Add the controller file
      // ----
      var fileName = env.firstArg;
      // Convert underscores to camelCase, e.g., 'neilPearts'
      controllerName = fleegix.string.camelize(fileName);
      // Capitalize the first letter, e.g., 'NeilPearts'
      controllerName = fleegix.string.capitalize(controllerName);
      // Grab the template text for the controller
      text = fs.readFileSync(__dirname + '/gen/resource_controller.ejs', 'utf8');
      // Stick in the controller name
      var templ = new fleegix.ejs.Template({text: text});
      templ.process({data: {controllerName: controllerName}});
      filePath = './app/controllers/' + fileName + '.js';
      fs.writeFileSync(filePath, templ.markup, 'utf8');
      sys.puts('[ADDED] ' + filePath);

      // Add the route
      // ----
      // Grab the config text
      filePath = './config/router.js';
      text = fs.readFileSync(filePath, 'utf8');
      // Add the new resource route just above the export
      routerArr = text.split('exports.router');
      routerArr[0] += 'router.resource(\'' +  fileName + '\');\n';
      text = routerArr.join('exports.router');
      fs.writeFileSync(filePath, text, 'utf8');
      sys.puts('resources ' + fileName + ' route added to ' + filePath);
      
      var cmds = [
        'mkdir -p ./app/views/' + fileName,
        'cp ~/.node_libraries/geddy-core/scripts/gen/views/* ' + './app/views/' + fileName + '/'
      ]
      runCmds(cmds, function () {
        sys.puts('Created view templates.');
      });
    }
  }

};

// Runs an array of shell commands asynchronously, calling the
// next command off the queue inside the callback from sys.exec.
// When the queue is done, call the final callback function.
var runCmds = function (arr, callback) {
  var run = function (cmd) {
    sys.exec(cmd, function (err, stdout, stderr) {
      if (err) {
        sys.puts('Error: ' + JSON.stringify(err));
      }
      else if (stderr) {
        sys.puts('Error: ' + stderr);
      }
      else {
        if (arr.length) {
          var next = arr.shift();
          run(next);
        }
        else {
          callback();
        }
      }
    });
  };
  run(arr.shift());
};

