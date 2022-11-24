module.exports = ({config}) => {
    //console.log(config); // prints 'My App'
    //console.log(Constants.manifest.extra.env.API_URL);
  
    // if (process.env.MY_ENVIRONMENT === 'production') {
    //     // return {
    //     //     ...config,
    //     //   };
    // } else {}
        config.extra.env = { "API_URL": process.env.API_URL}
        //console.log(config);
    return {
        ...config,
      };
  }
  