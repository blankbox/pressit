function plugin (data, core, utils) {

  this.data = data;
  this.utils = utils;
  this.core = core;
}


plugin.prototype.init = function () {
  console.log('init happend in plugin');

  var patterns = this.utils.handler(__dirname + '/patterns', {});

  this.scriptsTag = patterns.load('scripts.hbs');

  var self = this;

  this.utils.vent.on('response init', function (event, payload) {
    console.log('vent addScripts');
    self.addScripts(payload.req, payload.res);
  });

  this.utils.vent.on('dependancies scripts add', function (event, payload) {
    console.log('vent req');
    self.req(payload.req, payload.res);
  });

}

plugin.prototype.addScripts = function (req, res) {

  var scripts = [{
    id: 'jquery',
    src: '//ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js'
  }];

  if (typeof res.config.scripts.body === 'undefined') {
    res.config.scripts.body = []
  }

  if (typeof res.config.scripts.head === 'undefined') {
    res.config.scripts.head = []
  }

  res.config.scripts.head.push({
    id: 'jquery',
    src: '//ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js'
  });

}

plugin.prototype.req = function (req, res) {

  res.page('head').append(this.scriptsTag(res.config.scripts.head));
  res.page('body').append(this.scriptsTag(res.config.scripts.body));

}

module.exports = function (core, data, utils) {
  var _plugin = new plugin(core, data, utils);
  _plugin.init();
  return _plugin;
};
