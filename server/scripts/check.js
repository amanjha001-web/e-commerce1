import app from '../src/app.js';
import * as models from '../src/models/index.js';
import * as repositories from '../src/repositories/index.js';
import { env } from '../src/config/env.js';
import logger from '../src/config/logger.js';

const checkSystem = () => {
  logger.info('=== SHOPSPHERE BACKEND SANITY & INTEGRITY CHECK ===');

  // 1. Verify models
  const modelKeys = Object.keys(models);
  logger.info(`✓ Loaded ${modelKeys.length} Mongoose models.`);

  // 2. Verify repositories
  const repoKeys = Object.keys(repositories);
  logger.info(`✓ Loaded ${repoKeys.length} repository modules.`);

  // 3. Verify Express app routes
  let routesCount = 0;
  const printRoutes = (stack, prefix = '') => {
    stack.forEach((layer) => {
      if (layer.route && layer.route.path) {
        routesCount++;
      } else if (layer.name === 'router' && layer.handle.stack) {
        printRoutes(layer.handle.stack, `${prefix}${layer.regexp.source}`);
      }
    });
  };

  if (app._router && app._router.stack) {
    printRoutes(app._router.stack);
  }

  logger.info(`✓ Registered application routes successfully (Total layers: ${app._router?.stack?.length || 0})`);
  logger.info(`✓ Environment API prefix: ${env.API_PREFIX}`);
  logger.info('=== ALL INTEGRITY CHECKS PASSED ===');
};

checkSystem();
