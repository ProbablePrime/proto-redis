import * as Types from './types.js';

const CRLF = Types.CRLF;

export function encodeLine(line) {
	return encodeArray(line.split(' '));
}

export function encodeArray(input) {
	return input.reduce((previous, current) => {
		return previous + encodeType(current);
	},
	`*${input.length}${CRLF}`
	);
}
export function encodeType(value) {
	if (Array.isArray(value)) {
		return encodeArray(value);
	}
	const num = parseInt(value, 10);
	if (isNaN(num)) {
		return encodeString(value);
	}
	return encodeInteger(num);
}

export function encodeInteger(value) {
	return Types.typeToString(Types.INTEGER) + value + CRLF;
}

export function encodeString(value) {
	return Types.typeToString(Types.BULK_STRING) + value.length + CRLF + value + CRLF;
}

export default {
	encodeLine,
	encodeString,
	encodeInteger,
	encodeArray
};
