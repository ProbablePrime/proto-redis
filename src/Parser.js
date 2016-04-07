import * as Types from './types.js';

const defaultOptions = {
	replyCallback: () => {},
	errorCallback: () => {}
};
export default class Parser {
	constructor(options = {}) {
		this.options = Object.assign({}, defaultOptions, options);
		this.position = 0;
		this.buffer = null;
	}

	bufferToString(buffer, start, end) {
		return buffer.toString('utf8', start, end);
	}

	parseString(buffer, offset) {
		// +OK\r\n
		// Protocol spec says to include the CRLF
		const end = this.findTerminator(buffer, offset);
		return this.bufferToString(buffer, offset, end + 2);
	}

	parseError(buffer, offset) {
		const end = this.findTerminator(buffer, offset);
		const res = this.bufferToString(buffer, offset, end);
		this.position = end + 2;
		throw new Error(res);
	}

	parseInteger(buffer, offset) {
		const end = this.findTerminator(buffer, offset);
		const res = this.bufferToString(buffer, offset, end);
		this.position = end + 2;
		return parseInt(res, 10);
	}

	parseBulkString(buffer, offset) {
		if (buffer[offset] === '-'.charCodeAt() && buffer[offset + 1] === '1'.charCodeAt()) {
			this.position += 4;
			return null;
		}
		const byteLength = this.parseInteger(buffer, offset);
		const startOfString = this.findTerminator(buffer, offset) + 2;
		const res = this.bufferToString(buffer, startOfString, startOfString + byteLength);
		this.position = startOfString + byteLength + 2;
		return res;
	}

	parseArray(buffer, start) {
		this.position = start;
		const arrayLength = this.parseInteger(buffer, this.position);
		if (arrayLength === 0) {
			return [];
		}
		const returnArray = [];
		while (returnArray.length < arrayLength) {
			const type = this.identifyType(buffer, this.position ++);
			returnArray.push(this.parseType(type, buffer, this.position));
		}
		return returnArray;
		// "*2\r\n
		// $3\r\nfoo\r\n
		// $3\r\nbar\r\n"
	}

	parseType(type, buffer, start) {
		switch (type) {
			case Types.STRING:
				return this.parseString(buffer, start);
			case Types.ERROR:
				return this.parseError(buffer, start);
			case Types.INTEGER:
				return this.parseInteger(buffer, start);
			case Types.BULK_STRING:
				return this.parseBulkString(buffer, start);
			case Types.ARRAY:
				return this.parseArray(buffer, start);
			default:
				throw new Error(`Unrecognized message type: ${String.fromCharCode(type)}`);
		}
	}
	identifyType(buffer, position) {
		return buffer[position];
	}
	parse(buffer) {
		this.buffer = buffer;
		// make this a member variable?
		this.position = 0;
		if (buffer.length === 0) {
			return;
		}
		this.options.replyCallback(this.parseType(this.identifyType(buffer, this.position++), buffer, this.position));
	}

	findTerminator(buffer, offset) {
		let terminator = offset;
		while (buffer[terminator] !== Types.CR && buffer[terminator + 1] !== Types.LF) {
			terminator++;
		}
		return terminator;
	}
}
