import commonjs from '@rollup/plugin-commonjs'

const input = 'push.js'
const plugins = [commonjs()]

export default [
  {
    input,
    output: {
      file: 'dist/umd/push-wrapper.js',
      format: 'umd',
      name: 'pushWrapper'
    },
    plugins
  },
  {
    input,
    output: {
      file: 'dist/esm/push-wrapper.js',
      format: 'esm'
    },
    plugins
  }
]
