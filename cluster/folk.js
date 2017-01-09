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

var plugins = fs.readdirSync(__dirname + '/../app');
for (plugin in plugins) {
  require('../app/' + plugins[plugin])(core, data, utils, config);
}

console.log('plugins', plugins);

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

var init = function init (req, res, next) {

  var fullRequestObject = {req: req, res: res};

  res.config = {
    scripts: {}
  };

  var origin = (req.headers.origin ? req.headers.origin : req.headers.host).split(':');
  req.pressit = {
    _domain: origin[0],
    _port: origin[1]
  };
  res.pressit = {
    _type: 'html'
  };
  vent.emit('pressit init', fullRequestObject);
  vent.emit('pressit loaded', fullRequestObject);

  return next();

}

function parse_request (req, res, next) {

  var fullRequestObject = {req: req, res: res};

  vent.emit('parse init', fullRequestObject);
  vent.emit('parse done', fullRequestObject);

  return next();

}


function template (req, res, next) {

  var fullRequestObject = {req: req, res: res};

  res.pressit._tempate = __dirname + '/../project/core/templates/html/html-wrapper.html'
  vent.emit('template init', fullRequestObject);
  vent.emit('template set', fullRequestObject);

  return next();

}

function dom (req, res, next) {

  var fullRequestObject = {req: req, res: res};

  vent.emit('template beforeload', fullRequestObject);
  var main_template = cache.load(res.pressit._tempate);
  vent.emit('template loaded', fullRequestObject);

  vent.emit('page init', fullRequestObject);
  res.dom = $.load(main_template);
  vent.emit('page loaded', fullRequestObject);

  return next();

}

function menus (req, res, next) {

  var fullRequestObject = {req: req, res: res};

  vent.emit('menu init', fullRequestObject);
  vent.emit('menu build', fullRequestObject);
  vent.emit('menu loaded', fullRequestObject);


  return next();

}

function dependancies (req, res, next) {

  var fullRequestObject = {req: req, res: res};

  vent.emit('dependancies init', fullRequestObject);
  vent.emit('dependancies scripts', fullRequestObject);
  vent.emit('dependancies scripts add', fullRequestObject);
  vent.emit('dependancies links', fullRequestObject);

  return next();

}

function pre_compile (req, res, next) {

  var fullRequestObject = {req: req, res: res};

  return next();

}


function compile (req, res, next) {

  var fullRequestObject = {req: req, res: res};

  res.dom('[data-logo]').text(req.pressit._domain);

  vent.emit('response built', fullRequestObject);

  vent.emit('widget init', fullRequestObject);
  vent.emit('widget build', fullRequestObject);
  vent.emit('widget loaded', fullRequestObject);

  vent.emit('meta init', fullRequestObject);
  vent.emit('meta load', fullRequestObject);

  return next();

}


function response (req, res, next) {

  var fullRequestObject = {req: req, res: res};

  vent.emit('response init', fullRequestObject);
  vent.emit('response loaded', fullRequestObject);

  res.type(res.pressit._type);
  res.end(res.dom.html());

  return next();

}

function post_response (req, res, next) {

  var fullRequestObject = {req: req, res: res};

  vent.emit('response sent', fullRequestObject);

}

var init_array = [init];
init_array.push(parse_request);

app.use(init_array);
//app.use(parse_request);
app.use(template);
app.use(dom);
app.use(menus);
app.use(dependancies);
app.use(pre_compile);
app.use(compile);
app.use(response);
app.use(post_response);

var port = process.env.TERRA_PORT;

if (process.env.PORT) {
  port = process.env.PORT;
}

// @TODO add secure end point
app.listen(port, function () {
  debug.info('Example app listening on port', port);
});
