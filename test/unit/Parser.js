const chai = require('chai');
const expect = chai.expect;
import Parser from '../../src/Parser.js';
import * as Types from '../../src/types.js';
import Encoder from '../../src/Encoder.js';

const ok = "+OK\r\n";
const TYPE_OFFSET = 1;
const buf = new Buffer(ok);
const offset = 0;
const CRLF = Types.CRLF;

describe('Parser', () => {
	let parser;
	beforeEach(() => {
		parser = new Parser({});
	});
	it('checks if an index is within a buffer\'s length', () => {
		const buffer = new Buffer("1234");
		/* eslint-disable no-unused-expressions*/
		expect(parser.bufferHasIndex(buffer, 0)).to.be.ok;
		expect(parser.bufferHasIndex(buffer, 1)).to.be.ok;
		expect(parser.bufferHasIndex(buffer, 2)).to.be.ok;
		expect(parser.bufferHasIndex(buffer, 3)).to.be.ok;
		expect(parser.bufferHasIndex(buffer, 4)).to.not.be.ok;
		/* eslint-enable no-unused-expressions*/
	});
	it('Converts a start and end index within a buffer to a string', () => {
		expect(parser.bufferToString(buf, TYPE_OFFSET, parser.findTerminator(buf, TYPE_OFFSET))).to.equal(ok.substring(1, 3));
	});
	it('finds the next terminator for a given buffer and offset position', () => {
		expect(parser.findTerminator(buf, offset)).to.equal(ok.length - 2);
	});
	it('handles cases where the terminator is missing', () => {
		const brokenBuf = new Buffer('1234567890');
		const res = parser.findTerminator(brokenBuf, 0);
		expect(res).to.equal(brokenBuf.length);
	});

	it('parses a string preserving CRLF', () => {
		expect(parser.parseString(buf, offset + 1)).to.equal(ok.substring(1, ok.length));
	});
	it('parses an int correctly', () => {
		const buf = new Buffer(`:1${CRLF}`);
		expect(parser.parseInteger(buf, TYPE_OFFSET)).to.equal(1);
	});
	it('parses variable length ints correctly', () => {
		const ints = [0, 10, 100];
		const buffers = ints.map(v => new Buffer(`:${v}\r\n`));
		buffers.forEach((v, i) => {
			expect(parser.parseInteger(v, TYPE_OFFSET)).to.equal(ints[i]);
		});
	});
	it('parses a bulkstring correctly', () => {
		const bulk = "$5\r\nhello\r\n";
		const bulkBuffer = new Buffer(bulk);
		expect(parser.parseBulkString(bulkBuffer, TYPE_OFFSET)).to.equal(bulk.substring(4, 9));
	});

	it('parses a null bulk string correctly', () => {
		expect(parser.parseBulkString(new Buffer(`$-1${CRLF}`), TYPE_OFFSET)).to.equal(null);
	});
	it('parses an array correctly', () => {
		const input = ['echo', 'hello'];
		const bufString = Encoder.encodeArray(input);
		const arrayBuffer = new Buffer(bufString);
		const arrayResult = parser.parseArray(arrayBuffer, TYPE_OFFSET);
		expect(arrayResult.length).to.equal(input.length);
		arrayResult.forEach((v, i) => {
			expect(v).to.equal(input[i]);
		});
	});
	it('parses a mixed type array properly', () => {
		const expected = ['hello', 100];
		const bufString = `*2${CRLF}$5${CRLF}hello${CRLF}:100${CRLF}`;
		const arrayBuffer = new Buffer(bufString);
		const arrayResult = parser.parseArray(arrayBuffer, TYPE_OFFSET);
		expect(arrayResult).to.deep.equal(expected);
	});
	it('parses an empty array correctly', () => {
		const bufString = `*0${CRLF}`;
		const arrayBuffer = new Buffer(bufString);
		const arrayResult = parser.parseArray(arrayBuffer, TYPE_OFFSET);
		expect(arrayResult.length).to.equal(0);
	});
	it('parses a null array correctly', () => {
		const bufString = `*-1${CRLF}`;
		const nullBuffer = new Buffer(bufString);
		const result = parser.parseArray(nullBuffer, TYPE_OFFSET);
		expect(result).to.equal(null);
	});
	it('parses a multi-dimensional array correctly', () => {
		const bufString = `*2${CRLF}*3${CRLF}:1${CRLF}:2${CRLF}:3${CRLF}*2${CRLF}+Foo${CRLF}+Bar${CRLF}`;
		const multiArrayBuf = new Buffer(bufString);
		const expected = [[1, 2, 3], [`Foo${CRLF}`, `Bar${CRLF}`]];
		const result = parser.parseArray(multiArrayBuf, TYPE_OFFSET);
		expect(result).to.deep.equal(expected);
	});
	it('parses an array with null values correctly', () => {
		const bufString = `*3${CRLF}$3${CRLF}foo${CRLF}$-1${CRLF}$3${CRLF}bar${CRLF}`;
		const nullContainingArrayBuf = new Buffer(bufString);
		const expected = ['foo', null, 'bar'];
		const result = parser.parseArray(nullContainingArrayBuf, TYPE_OFFSET);
		expect(result).to.deep.equal(expected);
	});
	it('handles partial data', () => {
		// The server can send multiple packets relating to the same context
		const expected = [1, 2, 3, 4, 'foobar'];
		const partialDataArray = [
			new Buffer(`*5${CRLF}`),
			new Buffer(`:1${CRLF}`),
			new Buffer(`:2${CRLF}`),
			new Buffer(`:3${CRLF}`),
			new Buffer(`:4${CRLF}`),
			new Buffer(`$6${CRLF}`),
			new Buffer(`foobar${CRLF}`)
		];
		parser.options.replyCallback = data => {
			expect(data).to.deep.equal(expected);
		};
		partialDataArray.forEach(buf => {
			parser.parse(buf);
		});
	});
	it('calls the replyCallback with the parsed data', () => {
		let callCount = 0;
		const bufString = `*3${CRLF}$3${CRLF}foo${CRLF}$-1${CRLF}$3${CRLF}bar${CRLF}`;
		const expected = ['foo', null, 'bar'];
		parser.options.replyCallback = data => {
			callCount++;
			expect(data).to.deep.equal(expected);
		};
		parser.parse(new Buffer(bufString));
		expect(callCount).to.equal(1);
	});
	it('complains on a parser error', () => {
		const bufString = `*3${CRLF}$3${CRLF}foo1${CRLF}$-1${CRLF}$3${CRLF}bar${CRLF}`;
		expect(() => {
			parser.parse(new Buffer(bufString));
		}).to.throw(Error);
	});
	it('resets on a parser error', () => {
		const errorString = `*3${CRLF}$3${CRLF}foo${CRLF}${CRLF}${CRLF}${CRLF}$-1${CRLF}$3${CRLF}bar${CRLF}`;
		const okString = `*3${CRLF}$3${CRLF}foo${CRLF}$-1${CRLF}$3${CRLF}bar${CRLF}`;
		const expected = ['foo', null, 'bar'];
		parser.options.replyCallback = data => {
			expect(data).to.deep.equal(expected);
		};
		expect(() => {
			parser.parse(new Buffer(errorString));
		}).to.throw(Error);
		parser.parse(new Buffer(okString));
	});
});
