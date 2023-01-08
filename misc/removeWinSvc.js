var Service = require('node-windows').Service;
const path = require('path');
var parentDir = path.dirname(require.main.filename).replace(path.basename(path.dirname(require.main.filename)), '');

// Create a new service object
var svc = new Service({
  name:'custom-hds',
  script: `${parentDir}/index.js`
});

// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall',function(){
  console.log('Uninstall complete.');
  console.log('The service exists: ',svc.exists);
});

// Uninstall the service.
svc.uninstall();