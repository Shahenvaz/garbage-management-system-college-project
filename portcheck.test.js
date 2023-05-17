const port = require('./porttest')


//testing module
test('string with a single number should result in the number itself', () => {
    expect(port.portTest()).toBe(8081);
  });



//testing
