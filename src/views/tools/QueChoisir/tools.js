const isLetter = (char) => {
    return char != null && char.length === 1 && char.match(/[a-z]/i) ? true : false;
}

const isNumber = (char) => {
    return char != null && char.length === 1 && char.match(/[0-9]/i) ? true : false;
}

const isInHistory = (ref, value, history) => {
    let isIn = false
    history.forEach(historyElement => {
        if (historyElement.question.ref == ref) {
            historyElement.responses.forEach(response => {
                if (response.response.value == value) {
                    isIn = true
                    return
                }
            });
        }
    });
    return isIn
}

export const evaluateExpression = async (exp, userHistory) => {
    var i = 0

    let toEvaluate = exp

    let refToCheck = ""
    let valueToCheck = ""


    while (i < exp.length) {

        if (isLetter(exp[i])) {
            refToCheck += exp[i]
        }
        if (isNumber(exp[i])) {
            valueToCheck += exp[i]
        }

        if (i + 1 == exp.length || (!isLetter(exp[i + 1]) && !isNumber(exp[i + 1]))) {
            if (refToCheck.length > 0 && valueToCheck.length > 0) {
                var re = new RegExp(`\\b${refToCheck + valueToCheck}\\b`, 'g')
                if (isInHistory(refToCheck, valueToCheck, userHistory)) {
                    toEvaluate = toEvaluate.replace(re, true)
                } else {
                    toEvaluate = toEvaluate.replace(re, false)
                }

            }


            refToCheck = ""
            valueToCheck = ""
        }

        i++
    }
    return eval(toEvaluate)
}