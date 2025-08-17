export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  appName: 'CareSync',
  version: '1.0.0',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'es', 'fr'],
  features: {
    analytics: true,
    fileUpload: true,
    notifications: true,
    realTimeChat: false
  },
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50]
  },
  fileUpload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
    maxFiles: 5
  },
  notifications: {
    autoHideDuration: 5000,
    position: {
      horizontal: 'center',
      vertical: 'top'
    }
  },
  security: {
    tokenExpiryWarning: 5 * 60 * 1000, // 5 minutes
    refreshTokenInterval: 4 * 60 * 1000 // 4 minutes
  }
};
