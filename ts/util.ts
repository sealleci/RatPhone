/**
 * Sleep for given time.
 * 
 * Usage:
 * ``` js
 * await sleep(100)
 * ```
 * @param ms Milliseconds.
 */
function sleep(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms)
    })
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
function rangeRandom(min: number, max?: number): number {
    if (max === undefined) {
        max = min - 1
        min = 0
    }

    if (min > max) {
        [min, max] = [max, min]
    }

    return Math.floor(Math.random() * (max - min + 1)) + Math.floor(min)
}

/**
 * Remove all chidlren elements from the given element.
 */
function removeChildren(element: HTMLElement) {
    for (const child of Array.from(element.childNodes)) {
        element.removeChild(child)
    }
}

/**
 * Add the given class to the given element if the class doesn't exist, 
 * otherwise remove the class from the element.
 */
function toggleClass(element: HTMLElement, class_name: string) {
    if (element.classList.contains(class_name)) {
        element.classList.remove(class_name)
    } else {
        element.classList.add(class_name)
    }
}

/**
 * Add the given class to the given element.
 */
function addClass(element: HTMLElement, class_name: string) {
    if (!element.classList.contains(class_name)) {
        element.classList.add(class_name)
    }
}

/**
 * Remove the given class from the given element.
 */
function removeClass(element: HTMLElement, class_name: string) {
    if (element.classList.contains(class_name)) {
        element.classList.remove(class_name)
    }
}

export { sleep, rangeRandom }
export { removeChildren, toggleClass, addClass, removeClass }