/* jshint node: true */

module.exports = function (environment) {
    var ENV = {
        modulePrefix: 'azureexplorer',
        environment: environment,
        baseURL: '/',
        locationType: 'hash',
        EmberENV: {
            FEATURES: {
                // Here you can enable experimental features on an ember canary build
                // e.g. 'with-controller': true
            }
        },

        exportApplicationGlobal: true,

        APP: {
            // Here you can pass flags/options to your application instance
            // when it is created
        },

        sassOptions: {
            includePaths: ['bower_components/materialize/sass']
        },
        
        dnsSuffixContent: ['blob.core.windows.net', 'blob.core.chinacloudapi.cn'] , // set default dns suffix urls
        
        /*jshint -W109 */
        contentSecurityPolicy: {
            'default-src': "'none'",
            'script-src': "'unsafe-inline' 'self' https://cdn.mxpnl.com", // Allow scripts from https://cdn.mxpnl.com
            'font-src': "'self' http://fonts.gstatic.com", // Allow fonts to be loaded from http://fonts.gstatic.com
            'connect-src': "'self' https://api.mixpanel.com http://custom-api.local", // Allow data (ajax/websocket) from api.mixpanel.com and custom-api.local
            'img-src': "'self'",
            'style-src': "'self' 'unsafe-inline' http://fonts.googleapis.com", // Allow inline styles and loaded CSS from http://fonts.googleapis.com 
            'media-src': "'self'"
        }
        /*jshint +W109 */
        
    };

    if (environment === 'test') {
        // Testem prefers this...
        ENV.baseURL = '/';
        ENV.locationType = 'none';
        
        // keep test console output quieter
        ENV.APP.LOG_ACTIVE_GENERATION = false;
        ENV.APP.LOG_VIEW_LOOKUPS = false;

        ENV.APP.rootElement = '#ember-testing';
    }

    if (process && process.env) {
        process.env.EMBER_CLI_NW = true;
    }

    
      if (environment === 'production') {

      }

      // if (environment === 'development') {
      //   ENV.APP.LOG_RESOLVER = true;
      //   ENV.APP.LOG_ACTIVE_GENERATION = true;
      //   ENV.APP.LOG_TRANSITIONS = true;
      //   ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
      //   ENV.APP.LOG_VIEW_LOOKUPS = true;
      // }
    
    return ENV;
};