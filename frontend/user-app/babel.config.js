module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["."],
          alias: {
            "@": "./",
            "@shared": "../../shared",
          },
        },
      ],
      ["@babel/plugin-transform-flow-strip-types", { allowDeclareFields: false }],
      ["@babel/plugin-transform-typescript", { allowDeclareFields: true, allExtensions: true, isTSX: true }],
      ["@babel/plugin-transform-class-properties", { loose: true }],
      ["@babel/plugin-transform-private-methods", { loose: true }],
      ["@babel/plugin-transform-private-property-in-object", { loose: true }],
      ["@babel/plugin-transform-classes", { loose: true }],
      "@babel/plugin-transform-async-to-generator",
      "react-native-reanimated/plugin",
    ],
  };
};
