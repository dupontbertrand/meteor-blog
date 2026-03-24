const { defineConfig } = require('@meteorjs/rspack');

module.exports = defineConfig(Meteor => {
  const config = {};
  if (Meteor.isServer) {
    config.externals = [/^mjml/, 'html-minifier', 'uglify-js'];
  }
  return config;
});
