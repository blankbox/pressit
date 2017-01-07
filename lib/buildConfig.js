var cache = require('./cacheFiles.js');
// Function to return the bower path by passing the bower package name
var bowerPath = require('bower-discover');

var collectionDir;

var projectObj = {collections: [], menuItems: [], menu: {}, bowerItems: [], bower: {}, cdns: {}};

var parseConfig = function (root, collection, collectionConfig) {

    console.log('root', root);

  // Process any bower items
  if (typeof collectionConfig.bower !== 'undefined' && collectionConfig.bower.length) {

    projectObj.bowerItems = projectObj.bowerItems.concat(collectionConfig.bower);

    for (var l = 0; l < collectionConfig.bower.length; l++) {
      var bowerItem = collectionConfig.bower[l];

      var bowerName = bowerItem.name;
      var bowerPackage = bowerItem.package;
      var bowerVersion = bowerItem.version;
      var pathArray = bowerPath(bowerItem.name);

      // @TODO bring out seperate paths
      // @TODO seperate file extensions occurdingly
      for (var m = 0; m < pathArray.length; m++) {
        // console.log('bowerName', bowerName);
        // console.log('bowerPath', pathArray[m]);
        // console.log();
      }

      var bowerObj = {
        name: bowerName,
        version: bowerVersion,
        package: bowerPackage,
        paths: pathArray
      };

      // Detect if menu object exists yet
      if (typeof projectObj.bower[bowerName] == 'undefined') {
        projectObj.bower[bowerName] = {};
      }

      // Add item to the menu object's array
      projectObj.bower[bowerName] = bowerObj;

    }

  }


  // Process any menu items
  if (typeof collectionConfig.menuItems !== 'undefined' && collectionConfig.menuItems.length) {

    // Merge menu items into the core array
    projectObj.menuItems = projectObj.menuItems.concat(collectionConfig.menuItems);

    // Loop through the menu items to build seperate menu level object
    for (var j = 0; j < collectionConfig.menuItems.length; j++) {

      // Menus that the item is being applied to
      var menus = collectionConfig.menuItems[j].menu;
      // The menu item itself - copies whatever object schema is found
      var item = collectionConfig.menuItems[j].item;

      // For each menu that the item is being applied to
      for (var k = 0; k < menus.length; k++) {
        // Menu that is being applied to
        var menuName = menus[k];

        // Detect if menu object exists yet
        if (typeof projectObj.menu[menuName] == 'undefined') {
          projectObj.menu[menuName] = [];
        }

        // Add item to the menu object's array
        projectObj.menu[menuName].push(item);

      }

    }

  }

  // Process any cdn registeries
  if (typeof collectionConfig.cdns !== 'undefined' && collectionConfig.cdns.length) {

    // Loop through the CDN list
    for (var n = 0; n < collectionConfig.cdns.length; n++) {

      // CDN Name
      var cdn = collectionConfig.cdns[n].name;
      var route = collectionConfig.cdns[n].route;

      if (!projectObj.cdns[cdn]) {
        projectObj.cdns[cdn] = route;
      }

    }

    if (typeof projectObj.cdns['default'] === 'undefined') {
      projectObj.cdns['default'] = '/'
    }

  }


  // Track the collection name for later reference
  if (typeof root !== 'undefined') {
    projectObj.collections.push(root + '.' + collection);
  } else {
    projectObj.collections.push(collection);
  }

  // Pass to load more children configuration files
  if (typeof collectionConfig.load !== 'undefined' && collectionConfig.load.length) {
    return collectionConfig.load;
  }

};


var buildConfig = function (project) {

  collectionDir = project + '/collections';

  // Core config file from cache
  var config = cache.load(project + '/core/config.json');

  // Array of child configuration files
//  var collections = config.load;

//  console.log('coreCollections', JSON.stringify(config));

  var collections = parseConfig(undefined, 'core', config);

  // Build on top of core config a recursive configuration
  var allCollections = loadConfig(collectionDir, collections);

  return allCollections;

};


// The initial config loading logic
var loadConfig = function (root, list) {

  // Storage arrays
  var collectionNames = [];

  var menuItems = [];
  var menu = {};

  var bowerItems = [];
  var bower = {};

  var cdnReg = {};

  // Load a list of configuration files relative to a given root
  function load (loadList, root) {

//    console.log('root', root);

    for (var i = 0; i < loadList.length; i++) {

      // Name of this collection
      var collection = loadList[i];

      // Path to the configuration file
      var collectionPath = collectionDir + '/' + collection + '/config.json';
      // Fetch from cache or create cache
      var collectionConfig = cache.load(collectionPath);

      var loadChildren = parseConfig(root, collection, collectionConfig);

      // Process any child configuration files
      if (loadChildren) {

        // Loop to next child configuration file
        load(loadChildren, collection);

      }


    }

  }


  load(list);

  return projectObj;

//  return {collections: collectionNames, menuItem: menuItems, menu: menu, bowerItems: bowerItems, bower: bower, cdns: cdnReg};

};


module.exports = buildConfig;
