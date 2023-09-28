/**
 * @module Data
 * @submodule Conversion
 * @for p5
 * @requires core
 */

import p5 from '../core/main';

/**
 * Converts a string to its floating point representation. The contents of a
 * string must resemble a number, or NaN (not a number) will be returned.
 * For example, float("1234.56") evaluates to 1234.56, but float("giraffe")
 * will return NaN.
 *
 * When an array of values is passed in, then an array of floats of the same
 * length is returned.
 *
 * @method float
 * @param {String}  str float string to parse
 * @return {Number}     floating point representation of string
 * @example
 * <div><code>
 * let str = '20';
 * let diameter = float(str);
 * ellipse(width / 2, height / 2, diameter, diameter);
 * </code></div>
 * <div class='norender'><code>
 * print(float('10.31')); // 10.31
 * print(float('Infinity')); // Infinity
 * print(float('-Infinity')); // -Infinity
 * </code></div>
 *
 * @alt
 * 20 by 20 white ellipse in the center of the canvas
 *
 */
p5.prototype.float = str => {
  if (str instanceof Array) {
    return str.map(parseFloat);
  }
  return parseFloat(str);
};

/**
 * Converts a boolean, string, or float to its integer representation.
 * When an array of values is passed in, then an int array of the same length
 * is returned.
 *
 * @method int
 * @param {String|Boolean|Number}       n value to parse
 * @param {Integer}       [radix] the radix to convert to (default: 10)
 * @return {Number}                     integer representation of value
 *
 * @example
 * <div class='norender'><code>
 * print(int('10')); // 10
 * print(int(10.31)); // 10
 * print(int(-10)); // -10
 * print(int(true)); // 1
 * print(int(false)); // 0
 * print(int([false, true, '10.3', 9.8])); // [0, 1, 10, 9]
 * print(int(Infinity)); // Infinity
 * print(int('-Infinity')); // -Infinity
 * </code></div>
 */
/**
 * @method int
 * @param {Array} ns                    values to parse
 * @return {Number[]}                   integer representation of values
 */
p5.prototype.int = (n, radix = 10) => {
  if (n === Infinity || n === 'Infinity') {
    return Infinity;
  } else if (n === -Infinity || n === '-Infinity') {
    return -Infinity;
  } else if (typeof n === 'string') {
    return parseInt(n, radix);
  } else if (typeof n === 'number') {
    return n | 0;
  } else if (typeof n === 'boolean') {
    return n ? 1 : 0;
  } else if (n instanceof Array) {
    return n.map(n => p5.prototype.int(n, radix));
  }
};

/**
 * Converts a boolean, string or number to its string representation.
 * When an array of values is passed in, then an array of strings of the same
 * length is returned.
 *
 * @method str
 * @param {String|Boolean|Number|Array} n value to parse
 * @return {String}                     string representation of value
 * @example
 * <div class='norender'><code>
 * print(str('10')); // "10"
 * print(str(10.31)); // "10.31"
 * print(str(-10)); // "-10"
 * print(str(true)); // "true"
 * print(str(false)); // "false"
 * print(str([true, '10.3', 9.8])); // [ "true", "10.3", "9.8" ]
 * </code></div>
 */
p5.prototype.str = n => {
  if (n instanceof Array) {
    return n.map(p5.prototype.str);
  } else {
    return String(n);
  }
};

/**
 * Converts a number or string to its boolean representation.
 * For a number, any non-zero value (positive or negative) evaluates to true,
 * while zero evaluates to false. For a string, the value "true" evaluates to
 * true, while any other value evaluates to false. When an array of number or
 * string values is passed in, then a array of booleans of the same length is
 * returned.
 *
 * @method boolean
 * @param {String|Boolean|Number|Array} n value to parse
 * @return {Boolean}                    boolean representation of value
 * @example
 * <div class='norender'><code>
 * print(boolean(0)); // false
 * print(boolean(1)); // true
 * print(boolean('true')); // true
 * print(boolean('abcd')); // false
 * print(boolean([0, 12, 'true'])); // [false, true, true]
 * </code></div>
 */
p5.prototype.boolean = n => {
  if (typeof n === 'number') {
    return n !== 0;
  } else if (typeof n === 'string') {
    return n.toLowerCase() === 'true';
  } else if (typeof n === 'boolean') {
    return n;
  } else if (n instanceof Array) {
    return n.map(p5.prototype.boolean);
  }
};

/**
 * Converts a number, string representation of a number, or boolean to its byte
 * representation. A byte can be only a whole number between -128 and 127, so
 * when a value outside of this range is converted, it wraps around to the
 * corresponding byte representation. When an array of number, string or boolean
 * values is passed in, then an array of bytes the same length is returned.
 *
 * @method byte
 * @param {String|Boolean|Number}       n value to parse
 * @return {Number}                     byte representation of value
 *
 * @example
 * <div class='norender'><code>
 * print(byte(127)); // 127
 * print(byte(128)); // -128
 * print(byte(23.4)); // 23
 * print(byte('23.4')); // 23
 * print(byte('hello')); // NaN
 * print(byte(true)); // 1
 * print(byte([0, 255, '100'])); // [0, -1, 100]
 * </code></div>
 */
/**
 * @method byte
 * @param {Array} ns                   values to parse
 * @return {Number[]}                  array of byte representation of values
 */
p5.prototype.byte = n => {
  const nn = p5.prototype.int(n, 10);
  if (typeof nn === 'number') {
    return (nn + 128) % 256 - 128;
  } else if (nn instanceof Array) {
    return nn.map(p5.prototype.byte);
  }
};

/**
 * Converts a number or string to its corresponding single-character
 * string representation. If a string parameter is provided, it is first
 * parsed as an integer and then translated into a single-character string.
 * When an array of number or string values is passed in, then an array of
 * single-character strings of the same length is returned.
 *
 * @method char
 * @param {String|Number}       n value to parse
 * @return {String}             string representation of value
 *
 * @example
 * <div class='norender'><code>
 * print(char(65)); // "A"
 * print(char('65')); // "A"
 * print(char([65, 66, 67])); // [ "A", "B", "C" ]
 * print(join(char([65, 66, 67]), '')); // "ABC"
 * </code></div>
 */
/**
 * @method char
 * @param {Array} ns              values to parse
 * @return {String[]}             array of string representation of values
 */
p5.prototype.char = n => {
  if (typeof n === 'number' && !isNaN(n)) {
    return String.fromCharCode(n);
  } else if (n instanceof Array) {
    return n.map(p5.prototype.char);
  } else if (typeof n === 'string') {
    return p5.prototype.char(parseInt(n, 10));
  }
};

/**
 * Converts a single-character string to its corresponding integer
 * representation. When an array of single-character string values is passed
 * in, then an array of integers of the same length is returned.
 *
 * @method unchar
 * @param {String} n     value to parse
 * @return {Number}      integer representation of value
 *
 * @example
 * <div class='norender'><code>
 * print(unchar('A')); // 65
 * print(unchar(['A', 'B', 'C'])); // [ 65, 66, 67 ]
 * print(unchar(split('ABC', ''))); // [ 65, 66, 67 ]
 * </code></div>
 */
/**
 * @method unchar
 * @param {Array} ns       values to parse
 * @return {Number[]}      integer representation of values
 */
p5.prototype.unchar = n => {
  if (typeof n === 'string' && n.length === 1) {
    return n.charCodeAt(0);
  } else if (n instanceof Array) {
    return n.map(p5.prototype.unchar);
  }
};

/**
 * Converts a number to a string in its equivalent hexadecimal notation. If a
 * second parameter is passed, it is used to set the number of characters to
 * generate in the hexadecimal notation. When an array is passed in, an
 * array of strings in hexadecimal notation of the same length is returned.
 *
 * @method hex
 * @param {Number} n     value to parse
 * @param {Number} [digits]
 * @return {String}      hexadecimal string representation of value
 *
 * @example
 * <div class='norender'><code>
 * print(hex(255)); // "000000FF"
 * print(hex(255, 6)); // "0000FF"
 * print(hex([0, 127, 255], 6)); // [ "000000", "00007F", "0000FF" ]
 * print(Infinity); // "FFFFFFFF"
 * print(-Infinity); // "00000000"
 * </code></div>
 */
/**
 * @method hex
 * @param {Number[]} ns    array of values to parse
 * @param {Number} [digits]
 * @return {String[]}      hexadecimal string representation of values
 */
p5.prototype.hex = (n, digits) => {
  digits = digits === undefined || digits === null ? (digits = 8) : digits;
  if (n instanceof Array) {
    return n.map(n => p5.prototype.hex(n, digits));
  } else if (n === Infinity || n === -Infinity) {
    const c = n === Infinity ? 'F' : '0';
    return c.repeat(digits);
  } else if (typeof n === 'number') {
    if (n < 0) {
      n = 0xffffffff + n + 1;
    }
    let hex = Number(n)
      .toString(16)
      .toUpperCase();
    while (hex.length < digits) {
      hex = `0${hex}`;
    }
    if (hex.length >= digits) {
      hex = hex.substring(hex.length - digits, hex.length);
    }
    return hex;
  }
};

/**
 * Converts a string representation of a hexadecimal number to its equivalent
 * integer value. When an array of strings in hexadecimal notation is passed
 * in, an array of integers of the same length is returned.
 *
 * @method unhex
 * @param {String} n value to parse
 * @return {Number}      integer representation of hexadecimal value
 *
 * @example
 * <div class='norender'><code>
 * print(unhex('A')); // 10
 * print(unhex('FF')); // 255
 * print(unhex(['FF', 'AA', '00'])); // [ 255, 170, 0 ]
 * </code></div>
 */
/**
 * @method unhex
 * @param {Array} ns values to parse
 * @return {Number[]}      integer representations of hexadecimal value
 */
p5.prototype.unhex = n => {
  if (n instanceof Array) {
    return n.map(p5.prototype.unhex);
  } else {
    return parseInt(`0x${n}`, 16);
  }
};

export default p5;
