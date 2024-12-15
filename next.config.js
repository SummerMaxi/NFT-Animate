const path = require('path');

module.exports = {
  webpack: (config) => {
    config.resolve.alias['@traits'] = path.join(__dirname, 'public/Assets/traits');
    return config;
  },
  images: {
    domains: ['localhost'],
  }
}; 