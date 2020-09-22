module.exports = {
    intReLength: function (data, length) {
        var str = data.toString();
        const zeroToAppend = length - str.length;
        if (zeroToAppend) {
            for (let j = 0; j < zeroToAppend; j++) {
                str = "0" + str;
            }
        }
        return str;
    },
}