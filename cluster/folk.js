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
var templates = require('../lib/handlebarLoader.js')(__dirname + '/../project/core/patterns');

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
//app.use(favicon(__dirname + '/favicon.ico'));

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

app.get('*', function (req, res) {

  var main_template = cache.load(__dirname + '/../project/core/templates/html/html-wrapper.html');

  var menu_template = templates.load('menu_item.hbs');
  var main_menu_template = templates.load('main_menu.hbs');

  var page = $.load(main_template);

  res.type('html');

  page('[data-menu]').each(function() {

    var $menuContainer = $(this);

    var $menu = $('<ul class="main-menu" template-path="{{ path }}"></ul>');

    $menuContainer.append($menu);

    var menuName = $(this).data('menu');

    var menuData = config.menu[menuName];

    var items = [];

    for (var datum in menuData) {
      items.push($(menu_template(cdn, menuData[datum])));
    }

    $menu.append(items);

  });


  res.end(page.html());


});


var port = process.env.TERRA_PORT;

if (process.env.PORT) {
  port = process.env.PORT;
}

// @TODO add secure end point
app.listen(port, function () {
  debug.info('Example app listening on port', port);
});
