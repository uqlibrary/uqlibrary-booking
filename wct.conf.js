module.exports = {
  verbose: true,
  plugins: {
    //local: {
    //  browsers: ["chrome", "firefox"]
    //},
    sauce: {
      browsers: [
        {
          "browserName": "safari",
          "platform": "OS X 10.9",
          "version": "7"
        }
        ,
        {
          "browserName": "firefox",
          "platform": "Windows 8.1",
          "version": "34"
        },
        {
          "browserName": "internet explorer",
          "platform": "Windows 8.1",
          "version": "11"
        },
        {
          "browserName": "chrome",
          "platform": "OS X 10.9",
          "version": "39"
        }
        ]
    }
  }
};
