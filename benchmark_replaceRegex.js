const { parseVariables } = require('./app.js');
const Benchmark = require('benchmark');

const suite = new Benchmark.Suite;

// Test input with multiple variables to simulate real-world usage
const testContent = "Prompt: [ACTION: Write] a [FORMAT — Blog Post] about [TOPIC] for [AUDIENCE] which will be a [FORMAT — Blog Post]. [EXTRA] [ANOTHER] [MORE_VARS]";

suite.add('parseVariables', function() {
  parseVariables(testContent);
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run({ 'async': false });
