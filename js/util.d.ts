/**
 * Sleep for given time.
 *
 * Usage:
 * ``` js
 * await sleep(100)
 * ```
 * @param ms Milliseconds.
 */
declare function sleep(ms: number): Promise<void>;
/**
 * Return a random integer within given range.
 *
 * Usage:
 * ``` js
 * rangeRandom(5) // i in [0, 5)
 * rangeRandom(1, 10) // i in [1, 10]
 * ```
 */
declare function rangeRandom(min: number, max?: number): number;
