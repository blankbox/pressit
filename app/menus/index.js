// Class pattern plugin

//Build the plugin interface
function plugin (data, core, utils, config) {
  // Data offered by the request response cycle
  this.data = data;
  // Application utilities
  this.utils = utils;
  // Core application function
  this.core = core;
  // Application state configuration loaded at run time
  this.config = config;
}

// Export the main plugin module
module.exports = function (core, data, utils, config) {
  var _plugin = new plugin(core, data, utils, config);
  // All class pattern plugins must have an init
  _plugin.init();
  return _plugin;
};

plugin.prototype.details = function () {

  this.plugin = {
    name: 'Core Menu Plugin',
    name_space: 'menus'
  }

}

plugin.prototype.init = function () {
  console.log('init happend in plugin');

  var patterns = this.utils.handler(__dirname + '/patterns', {});

  this.scriptsTag = patterns.load('scripts.hbs');

  var self = this;

  this.utils.vent.on('menu init', function (event, payload) {
    console.log('menu init');
    self.addScripts(payload.req, payload.res);
  });

}

plugin.prototype.addScripts = function (req, res) {

  var self = this;

  var cdn = {cdn: self.config.cdns};
  console.log('build menu');

  var patterns = self.utils.handler(__dirname + '/patterns', {});

  var main_menu_template = patterns.load('main_menu.hbs');
  var menu_template = patterns.load('menu_item.hbs');


  res.page('[data-menu]').each(function() {

    var $menuContainer = res.page(this);

    var $menu = res.page('<ul class="main-menu" template-path="{{ path }}"></ul>');

    $menuContainer.append($menu);

    var menuName = res.page(this).data('menu');

    console.log('config', this.config);

    var menuData = self.config.menu[menuName];

    var items = [];

    for (var datum in menuData) {
      items.push(res.page(menu_template(cdn, menuData[datum])));
    }

    $menu.append(items);

  });

}

plugin.prototype.req = function (req, res) {

  res.page('head').append(this.scriptsTag(res.config.scripts.head));
  res.page('body').append(this.scriptsTag(res.config.scripts.body));

}
