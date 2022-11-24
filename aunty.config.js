module.exports = {
  type: 'preact',
  build: {
    entry: ['index', 'custom-great-southern-sky', 'custom-moon-tour']
  },
  babel: config => {
    config.plugins.push([require.resolve('@babel/plugin-proposal-class-properties')]);

    return config;
  },
  serve: {
    hot: false
  }
};
