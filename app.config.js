
module.exports = ({config}) => {
        config.extra.env = { EXPO_PUBLIC_API_URL: process.env.API_URL ?? 'https://api.orthomaster.fr'}
    return {
        ...config
      };
  }