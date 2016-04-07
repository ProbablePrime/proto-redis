const chai = require('chai');
const expect = chai.expect;
import Parser from '../../src/Parser.js';

const ok = "+OK\r\n";
const buf = new Buffer(ok);
const offset = 0;
const CRLF = '\r\n';

describe('Parser', () => {
	let parser;
	beforeEach(() => {
		parser = new Parser({});
	});
	it('Converts a start and end index within a buffer to a string', () => {
		expect(parser.bufferToString(buf, 1, parser.findTerminator(buf, 1))).to.equal(ok.substring(1, 3));
	});
	it('finds the next terminator for a given buffer and offset position', () => {
		expect(parser.findTerminator(buf, offset)).to.equal(ok.length - 2);
	});
	it('parses a string preserving CRLF', () => {
		expect(parser.parseString(buf, offset + 1)).to.equal(ok.substring(1, ok.length));
	});
	it('parses an int correctly', () => {
		const buf = new Buffer(`:1${CRLF}`);
		expect(parser.parseInteger(buf, 1)).to.equal(1);
	});
	it('parses variable length ints correctly', () => {
		const ints = [0, 10, 100];
		const buffers = ints.map(v => new Buffer(`:${v}\r\n`));
		buffers.forEach((v, i) => {
			expect(parser.parseInteger(v, 1)).to.equal(ints[i]);
		});
	});
	it('parses a bulkstring correctly', () => {
		const bulk = "$5\r\nhello\r\n";
		const bulkBuffer = new Buffer(bulk);
		expect(parser.parseBulkString(bulkBuffer, 1)).to.equal(bulk.substring(4, 9));
	});

	it('parses a null bulk string correctly', () => {
		expect(parser.parseBulkString(new Buffer(`$-1${CRLF}`), 1)).to.equal(null);
	});
	it('parses an array correctly', () => {
		const input = ['echo', 'hello'];
		const bufString = input.reduce((previous, current) => {
			// TODO: move this to an encoder
			return `${previous}$${current.length}${CRLF}${current}${CRLF}`;
		}, `*${input.length}${CRLF}`);
		const arrayBuffer = new Buffer(bufString);
		const arrayResult = parser.parseArray(arrayBuffer, 1);
		expect(arrayResult.length).to.equal(input.length);
		arrayResult.forEach((v, i) => {
			expect(v).to.equal(input[i]);
		});
	});
	it('parses a mixed type array properly', () => {
		const expected = ['hello', 100];
		const bufString = `*2${CRLF}$5${CRLF}hello${CRLF}:100${CRLF}`;
		const arrayBuffer = new Buffer(bufString);
		const arrayResult = parser.parseArray(arrayBuffer, 1);
		expect(arrayResult.length).to.equal(expected.length);
		arrayResult.forEach((v, i) => {
			expect(v).to.equal(expected[i]);
		});
	});
	it('parses an empty array correctly', () => {
		const bufString = `*0${CRLF}`;
		const arrayBuffer = new Buffer(bufString);
		const arrayResult = parser.parseArray(arrayBuffer, 1);
		expect(arrayResult.length).to.equal(0);
	});
});
