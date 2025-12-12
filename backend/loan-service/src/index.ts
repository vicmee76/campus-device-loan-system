// Import reflect-metadata for tsyringe dependency injection
import 'reflect-metadata';

// Import loan-app to start the server (side effect import)
import './loan-app';

// Start alert monitoring
import { startAlertMonitoring } from './api/utils/alerts';
startAlertMonitoring(60000); // Check every minute

