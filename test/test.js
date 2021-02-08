const assert = require('assert')
const expect = require('chai').expect

describe('Simple Math Test', () => {
    it('should return 2', () => {
        //assert.strictEqual(1 + 1, 2)
        expect(1 + 1).to.equal(2)
    });
    it('should return 9', () => {
        expect(3 * 3).to.equal(9)
    });

});
// How to test asynchronous code?
it('should equal 2',async () => {
    const result = await 4
    expect(result).to.equal(4)
});

