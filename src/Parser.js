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
		const end = this.findTerminator(buffer, offset);
		this.position = end + 2;
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
		this.position = offset;
		if (this.checkForNull(buffer, offset)) {
			this.position += 4;
			return null;
		}
		const byteLength = this.parseInteger(buffer, offset);
		const startOfString = this.findTerminator(buffer, offset) + 2;
		const endOfString = startOfString + byteLength;
		if (endOfString > buffer.length - 1) {
			throw new Error("Not Enough Data");
		}
		const res = this.bufferToString(buffer, startOfString, endOfString);
		this.position = startOfString + byteLength + 2;
		return res;
	}

	checkForNull(buffer, position) {
		return buffer[position] === '-'.charCodeAt() && buffer[position + 1] === '1'.charCodeAt();
	}

	parseArray(buffer, start) {
		this.position = start;

		if (this.checkForNull(buffer, this.position)) {
			this.position += 4;
			return null;
		}
		const arrayLength = this.parseInteger(buffer, this.position);
		if (arrayLength === 0) {
			return [];
		}
		const returnArray = [];
		while (returnArray.length < arrayLength) {
			if (!this.bufferHasIndex(buffer, this.position)) {
				throw new Error("Not Enough Data");
			}
			const type = this.identifyType(buffer, this.position ++);
			returnArray.push(this.parseType(type, buffer, this.position));
		}
		return returnArray;
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
		if (!this.bufferHasIndex(buffer, this.position)) {
			throw new Error("index out of bounds");
		}
		return buffer[position];
	}

	logBuffer(method = console.log, buffer) {
		method(this.bufferToString(buffer, 0, buffer.length).replace(/\r\n/g, 'CRLF'));
	}

	parse(buffer) {
		if (this.buffer && this.buffer.length > 0) {
			const originalLength = this.buffer.length;
			const newLength = buffer.length;
			const totalLength = originalLength + newLength;
			this.buffer = Buffer.concat([this.buffer, buffer], totalLength);
		} else {
			this.buffer = buffer;
		}
		this.position = 0;
		if (buffer.length === 0) {
			return;
		}
		try {
			const result = this.parseType(this.identifyType(this.buffer, this.position++), this.buffer, this.position);
			this.options.replyCallback(result);
		} catch (e) {
			if (e.message === 'Not Enough Data') {
				return;
			}
			this.buffer = null;
			this.position = 0;
			throw e;
		}
	}

	bufferHasIndex(buffer, index) {
		return index < buffer.length;
	}

	characterAtPosition(buffer, index, character) {
		if (this.bufferHasIndex(buffer, index)) {
			return buffer[index] === character;
		}
		return false;
	}
	terminatorIsAtIndex(buffer, index) {
		return this.characterAtPosition(buffer, index, Types.CR) && this.characterAtPosition(buffer, index + 1, Types.LF);
	}

	findTerminator(buffer, offset) {
		let terminator = offset;
		while (terminator < buffer.length && !this.terminatorIsAtIndex(buffer, terminator)) {
			terminator++;
		}
		return terminator;
	}
}
