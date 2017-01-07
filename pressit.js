var cluster = require('cluster');
var debug  = require('tracer').colorConsole();

require('dotenv-safe').load({path: '.env-private', sample: '.env-private-sample'});
require('dotenv-safe').load({path: '.env-public', sample: '.env-public-sample'});

// Push to different streams for clustering
if (cluster.isMaster){

  require('./cluster/master.js');

} else {

  require('./cluster/folk.js');

}

// Listen for dying workers
cluster.on('exit', function (worker) {

    // Replace the dead worker
    debug.error('Worker %d died :(', worker.id);
    // @TODO - pass the cluster object over so that it can be used later (as with originating run command: see "./cluster/folk.js")
    cluster.fork();

});

cluster.on('fork', function (worker) {
    debug.log('Worker: ' + worker.id, 'PID: ', worker.process.pid);
});
