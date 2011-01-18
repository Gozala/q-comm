'use strict'

exports['test utility functions'] = require('./utils');
exports['test get / put / post / del on atoms'] = require('./atoms');

if (module == require.main) require('test').run(exports)
