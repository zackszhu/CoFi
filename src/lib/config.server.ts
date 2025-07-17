import 'server-only'; // Ensures this module is only used on the server

import { type AppConfig, getConfig as getAppConfig } from './appConfigLoader';

export type { AppConfig };

export const getConfig = (): AppConfig => {
  return getAppConfig();
};
