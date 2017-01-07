var cluster   = require('cluster');
var debug    = require('tracer').colorConsole();

var cpuCount = require('os').cpus().length;

if (process.env.LOCATION == 'local' || process.env.NODE_ENV == 'development') {

  // If running locally, then use a single cluster so as not to litter the CPU with unneed tasks
  cpuCount = 1;

  debug.log('Running locally, only', cpuCount, 'CPU used in cluster.');

}

debug.warn('Cluster Master is running with', cpuCount, 'folks.');
debug.warn('env.LOCATION', process.env.LOCATION);

debug.info('Master', process.pid);

// Create a worker for each CPU
for (var i = 0; i < cpuCount; i += 1) {
  // Build a object to pass to each folk allowing later access if required
  var new_worker_env = {};
  new_worker_env.WORKER_NAME = 'Worker_' + i;
  // Run the folk
  cluster.fork(new_worker_env);
}
