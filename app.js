// console.log('hello world');
// console.log(window);
// console.log(global);
// console.log(document);
// console.log(process);
// require syntax - common js module

/* - single export
const generaterandomnumber = require('./utils'); // ./ - current directory && common js - not comes (.js at end)

console.log(`random number:${generaterandomnumber()}`);
*/

// not only function - we can export variables, objects, arrays, classes and many more

/* -  we get multiple exports as object

const {generaterandomnumber,celciusToFahrenheit} = require('./utils');
const utils = require('./utils');
console.log(`random number:${generaterandomnumber()}`);
console.log(`98 celcius to fahrenheit is :${celciusToFahrenheit(0)}`);
*/


// ES6 module - modern js module
//import { getposts1 } from "./postcontroller.js";
import { getposts } from "./postcontroller.js";
import { createpost } from "./postcontroller.js";
console.log(getposts1());
console.log(getposts());
console.log(createpost());

import  getposts1, {getpostlength} from "./postcontroller.js";
console.log(getposts1());
console.log(`get post length:${getpostlength()}`);