import commonjs from '@rollup/plugin-commonjs'

export default {
  input: 'push.js',
  output: {
    file: 'dist/push-wrapper.js',
    format: 'umd',
    name: 'pushWrapper'
  },
  plugins: [commonjs()]
}
