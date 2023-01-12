function padLeft(text, targetLength, padString) {
    let padding = ''
    while (text.length + padding.length < targetLength) {
        padding += padString.substring(0,
            Math.min(padString.length, targetLength - (text.length + padding.length)))
    }
    return padding + text
}

(async function () {
    console.log(padLeft('1', 5, '0'))
    console.log(padLeft('1', 6, 'AB'))
    console.log(padLeft('1', 4, 'ABCD'))
    console.log(padLeft('1', 2, '0'))
    console.log(padLeft('1', 1, '0'))
})();