// Import reflect-metadata for tsyringe dependency injection
import 'reflect-metadata';

// Start alert monitoring
import { startAlertMonitoring } from './api/utils/alerts';
startAlertMonitoring(60000); // Check every minute

// Import device-app to start the server (side effect import)
import './device-app';

