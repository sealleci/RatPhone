"use strict";
/**
 * Sleep for given time.
 *
 * Usage:
 * ``` js
 * await sleep(100)
 * ```
 * @param ms Milliseconds.
 */
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
/**
 * Return a random integer within given range.
 *
 * Usage:
 * ``` js
 * rangeRandom(5) // i in [0, 5)
 * rangeRandom(1, 10) // i in [1, 10]
 * ```
 */
function rangeRandom(min, max) {
    if (max === undefined) {
        max = min - 1;
        min = 0;
    }
    if (min > max) {
        [min, max] = [max, min];
    }
    return Math.floor(Math.random() * (max - min + 1)) + Math.floor(min);
}
//# sourceMappingURL=util.js.map