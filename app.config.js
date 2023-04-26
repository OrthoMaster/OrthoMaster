
module.exports = ({config}) => {
        config.extra.env = { API_URL: process.env.API_URL ?? 'https://api.orthomaster.fr'}
    return {
        ...config
      };
  }