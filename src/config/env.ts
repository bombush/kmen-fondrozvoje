import { ENV_VALUES } from './env.values'

// Define the type for our configuration
type EnvConfig = {
  readonly: boolean
  name: string
  version: string
  description: string
  isProduction: boolean
  dbAdapter: 'firebase' | 'lowdb'
  firebase: {
    projectId: string
    emulatorEnabled: boolean
  }
  lowdb: {
    dbPath: string
  }
  fio: {
    apiToken: string
  }
  bankConfig: {
    supportedBanks: string[]
    defaultFirstDateToFetch: Date
  }
}

// Simple validation to ensure critical values are present
function validateConfig(config: any): config is EnvConfig {
  // Just ensure Firebase project ID and FIO token are present
  // as these are critical for functionality
  if (!config.firebase?.projectId) {
    throw new Error('Missing Firebase project ID in configuration')
  }
  
  if (!config.fio?.apiToken) {
    throw new Error('Missing FIO API token in configuration')
  }
  
  return true
}

let conf: EnvConfig

// Try to load the config values, if they don't exist or are invalid, throw an error
try {
  if (!ENV_VALUES) {
    throw new Error('env.values.ts does not exist or does not export ENV_VALUES')
  }
  
  validateConfig(ENV_VALUES)
  
  // If validation passes, create the final config object
  conf = {
    readonly: true,
    ...ENV_VALUES
  } as const
  
  
} catch (error) {
  console.error('Configuration error:', error)
  throw new Error('Configuration file env.values.ts is missing or invalid. Please create this file with the required values.')
}

export const APP_CONFIG = conf
