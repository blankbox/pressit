var fs = require('fs-extra');
var path = require('path');
var chokidar = require('chokidar');
var handlebars = require('handlebars');
var _ = require('underscore');

function cache (rootPath) {

  console.log('rootPath', rootPath);

  this.rootPath = rootPath;
  this.fileCache = {};

}


var makeTemplate = function (source) {

  var template = handlebars.compile(source);

  return function acceptInput (first, second, third) {

    var output = _.extend({}, first, second, third);

    return template(output);

  }

}


cache.prototype.load = function (filePath) {

  var self = this;

  var fullPath = this.rootPath + '/' + filePath;

  if (typeof this.fileCache[fullPath] !== 'undefined') {
    return this.fileCache[fullPath];
  } else {
    var exists = fs.existsSync(fullPath);

    if (exists) {
      var isDir = fs.lstatSync(fullPath).isDirectory();

      if (!isDir) {

        if (path.extname(fullPath) === '.hbs') {

          chokidar.watch(fullPath).on('change', function (event, path) {

            var source = fs.readFileSync(fullPath);
            var template = makeTemplate(source);

            self.fileCache[fullPath] = template;

          });

          var source = fs.readFileSync(fullPath).toString();

          var template = makeTemplate(source);

          this.fileCache[fullPath] = template;


        } else {

            return false;

        }

        return this.fileCache[fullPath];

      } else {
        return false;
        // cache all files within folder?
      }

    } else {
      return false;
    }

  }

};

module.exports = function (rootPath) {
  return new cache(rootPath);
};
