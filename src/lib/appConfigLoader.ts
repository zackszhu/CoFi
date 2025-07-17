import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface AppConfig {
  users: { name: string; pin: string }[];
  predefined_categories: string[];
}

const configFilePath = path.join(process.cwd(), 'cofi.config.yaml');

let appConfig: AppConfig;

export const loadAppConfig = (): AppConfig => {
  if (appConfig) {
    return appConfig;
  }
  try {
    const fileContents = fs.readFileSync(configFilePath, 'utf8');
    const loadedConfig = yaml.load(fileContents) as AppConfig;
    if (!loadedConfig || !loadedConfig.users || !loadedConfig.predefined_categories) {
      throw new Error('Invalid configuration file structure. Ensure users and predefined_categories are defined.');
    }
    // Validate user structure
    if (!loadedConfig.users.every(user => typeof user.name === 'string' && typeof user.pin === 'string')) {
      throw new Error('Invalid user configuration. Each user must have a name and a pin, both strings.');
    }
    appConfig = loadedConfig;
  } catch (error) {
    console.error('Error loading or parsing cofi.config.yaml:', error);
    // Provide default values or re-throw if the config is critical
    appConfig = {
      users: [{ name: 'User1', pin: '1234' }, { name: 'User2', pin: '5678' }], // Default users
      predefined_categories: ['Default Category 1', 'Default Category 2'], // Default categories
    };
    // Or, if the application cannot run without a valid config:
    // throw new Error(`Failed to load application configuration: ${(error as Error).message}`);
  }
  return appConfig;
};

// Load the config immediately so it's available on import
loadAppConfig();

export const getConfig = (): AppConfig => {
  return loadAppConfig(); // Ensures config is loaded and returns it
};
