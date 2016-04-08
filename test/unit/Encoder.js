const chai = require('chai');
const expect = chai.expect;
import Encoder from '../../src/Encoder.js';
import * as Types from '../../src/types.js';

const CRLF = Types.CRLF;

describe('Encoder', () => {
	it('encodesStrings', () => {
		const input = 'hello';
		expect(Encoder.encodeString(input)).to.equal(`$5${CRLF}hello${CRLF}`);
	});
	it('encodesNumbers', () => {
		const input = 100;
		expect(Encoder.encodeInteger(input)).to.equal(`:100${CRLF}`);
	});
	it('encodesArrays', () => {
		const input = ['foo', 'bar'];
		expect(Encoder.encodeArray(input)).to.equal(`*2${CRLF}$3${CRLF}foo${CRLF}$3${CRLF}bar${CRLF}`);
	});
});
