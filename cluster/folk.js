// Util modules
var fs       = require('fs-extra');
var debug   = require('tracer').colorConsole();

// Web server (express middleware) modules
var express  = require('express');
var helmet   = require('helmet');
var cors     = require('cors');
var logger   = require('morgan');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');

// Fetch application dependancies
var cache = require('../lib/cacheFiles.js');
var buildConfig = require('../lib/buildConfig.js');

var baseData = {cdnsdefault: 'test-pass'};
var templates = require('handler')(__dirname + '/../project/core/patterns', baseData);

// Location variables
var project = __dirname + '/../project';
var collectionDir = project + '/collections';

var config = buildConfig(project);

var app = express();

// Consume middleware
app.use(bodyParser.json());
app.use(helmet());
app.use(cors());
app.use(logger('dev'));

// @TODO add favicon setting globally to the app
app.use(favicon(__dirname + '/../favicon.png'));

// In dev mode - output the entire configuration to a server
// @TODO put dev mode etc into envs

if (process.env.NODE_ENV === 'development') {

  app.locals.pretty = true;

  app.get('/config', function (req, res) {
    res.json(config);
  });

}


var $ = require('cheerio');

app.use(express.static('dist'));

var cdn = {cdn: config.cdns};

var vent = new require('../lib/vent.js');

var core = {};
var data = {};
var utils = {
  handler: require('handler'), // using handler for loading handlebars files
  vent: vent
};

require('../app/scripts')(core, data, utils, config);
require('../app/menus')(core, data, utils, config);

vent.on('request config', function (name) {
  console.log('event:', name)
});

vent.on('template', function (name) {
  console.log('event:', name)
});

// init
// loaded
// rendered
// complete

app.get('*', function (req, res) {

  var fullRequestObject = {req: req, res: res};

  req.config = {};
  vent.emit('request init', fullRequestObject);
  if (typeof req.config._type === 'undefined') {
    req.config._type = 'html';
  }
  vent.emit('request loaded', fullRequestObject);


  res.config = {
    scripts: {}
  };

  vent.emit('response init', fullRequestObject);
  vent.emit('response loaded', fullRequestObject);

  vent.emit('template init', fullRequestObject);
  if (typeof req.config.tempate === 'undefined') {
    req.config.tempate = __dirname + '/../project/core/templates/html/html-wrapper.html'
  }
  vent.emit('template set', fullRequestObject);

  var main_template = cache.load(req.config.tempate);
  vent.emit('template loaded', fullRequestObject);

  vent.emit('page init', fullRequestObject);
  res.page = $.load(main_template);
  vent.emit('page loaded', fullRequestObject);


  vent.emit('menu init', fullRequestObject);
  vent.emit('menu build', fullRequestObject);
  vent.emit('menu loaded', fullRequestObject);


  vent.emit('widget init', fullRequestObject);
  vent.emit('widget build', fullRequestObject);
  vent.emit('widget loaded', fullRequestObject);

  vent.emit('dependancies init', fullRequestObject);
  vent.emit('dependancies scripts', fullRequestObject);
  vent.emit('dependancies scripts add', fullRequestObject);
  vent.emit('dependancies links', fullRequestObject);

  vent.emit('meta init', fullRequestObject);
  vent.emit('meta load', fullRequestObject);

  vent.emit('response built', fullRequestObject);

  res.type(req.config._type);
  res.end(res.page.html());

  vent.emit('response sent', fullRequestObject);


});


var port = process.env.TERRA_PORT;

if (process.env.PORT) {
  port = process.env.PORT;
}

// @TODO add secure end point
app.listen(port, function () {
  debug.info('Example app listening on port', port);
});
