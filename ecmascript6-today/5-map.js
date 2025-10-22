// start the node repl in the command line:
// $ node --harmony 5-map.js

// Check what functions are available for Set in node --harmony repl
// Object.getOwnPropertyNames(Map.prototype)

// create new Map
var es6map = new Map();

// set map
es6map.set("edition", 6);        // key is string
es6map.set(262, "standard");     // key is number
es6map.set(undefined, "nah");    // key is undefined

var hello = function() {console.log("hello");};
es6map.set(hello, "Hello ES6!"); // key is function

// has map
console.log( "Value of 'edition' exits? " + es6map.has("edition") );     // true
console.log( "Value of 'year' exits? " + es6map.has("years") );          // false
console.log( "Value of 262 exits? " + es6map.has(262) );                 // true
console.log( "Value of undefined exits? " + es6map.has(undefined) );     // true
console.log( "Value of hello() exits? " + es6map.has(hello) );           // true

// delete map
es6map.delete(undefined);
console.log( "Value of undefined exits? " + es6map.has(undefined) );      // false

// get map
console.log( es6map.get(hello) ); // Hello ES6!
console.log( "Work is in progress for ES" + es6map.get("edition") ); // Work is in progress for ES6
