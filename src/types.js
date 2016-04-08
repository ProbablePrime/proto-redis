// For Simple Strings the first byte of the reply is "+"
// For Errors the first byte of the reply is "-"
// For Integers the first byte of the reply is ":"
// For Bulk Strings the first byte of the reply is "$"
// For Arrays the first byte of the reply is "*"

export const STRING = '+'.charCodeAt();
export const ERROR = '-'.charCodeAt();
export const INTEGER = ':'.charCodeAt();
export const BULK_STRING = '$'.charCodeAt();
export const ARRAY = '*'.charCodeAt();
export const CR = 13;
export const LF = 10;
export const CRLF = '\r\n';

export function typeToString(type) {
	return String.fromCharCode(type);
}
