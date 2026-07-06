const brackets = {
    '(': ')', // furigana
    '{': '}', // okurigana (these brackets can be omitted)
    '‹': '›', // furigana of saidokumoji
    '«': '»', // okurigana of saidokumoji
    '[': ']', // kaeriten
    //'<': '>', // HTML tag
};
const leftBrackets = Object.keys(brackets);
const rightBrackets = Object.values(brackets);
const leftBracketsStr = '\\' + leftBrackets.join('\\');
const rightBracketsStr = '\\' + rightBrackets.join('\\');
const otherBrackets = {
    '⦉': '⦊', // punctuation
    '⌊': '⌋', // kanji / ruby base
    '‘': '’', // multiple kanji as a single ruby base
    '“': '”', // unit (usually contains only one kanji)
};
const punctuationStr = '〻―・、，。…「」『』';

function isKana(str) {
    let code = str.charCodeAt();
    if (str === '・') return false; // ・ is in the katakana block but treated as punctuation here
    if (parseInt('3040', 16) <= code && code <= parseInt('30FF', 16)) return true; // Hiragana & Katakana
    if (parseInt('31F0', 16) <= code && code <= parseInt('31FF', 16)) return true; // Katakana Phonetic Extensions
    if (parseInt('FF66', 16) <= code && code <= parseInt('FF9F', 16)) return true; // Halfwidth Katakana
    return false;
}

function replaceBetween(str, left, right, from, to, condition = function () { return true; }) {
    return str.split(left).map(function (s) {
        if (!s.includes(right)) return s;
        s = s.split(right);
        s[0] = left + s[0] + right;
        if (condition(s[0])) s[0] = s[0].replace(from, to);
        return s.join('');
    }).join('');
}

// Detects the total length (in code units) of an IDS sequence starting at `pos`.
// Returns 0 if no valid IDS sequence is found.
function getIdsLength(str, pos) {
    var total = str.length, i = pos, len = 1, u;
    while (len) {
        u = str.codePointAt(i);
        if ((u >= 0x2FF0 && u <= 0x2FF1) || (u >= 0x2FF4 && u <= 0x2FFD)) {
            // binary operator
            len += 2;
        } else if (u >= 0x2FF2 && u <= 0x2FF3) {
            // trinary operator
            len += 3;
        } else if (u >= 0x2FFE && u <= 0x2FFF || u === 0x31EF) {
            // unary operator (31EF is a CJK stroke, sometimes used as IDS unary)
            len += 1;
        } else {
            // terminal character – no more components
        }
        // Advance one code unit (or two if surrogate pair)
        if (u >= 0x10000) {
            i += 2;
        } else {
            i += 1;
        }
        len--;
    }
    // Return the number of code units covered by the IDS, or 0 if it’s just a single char.
    var length = i - pos;
    return length > 1 ? length : 0;
}

function toHTML(str) {

    // font‑spec preprocessing
    const fontMappings = [];
    let fontCounter = 0;
    str = str.replace(/@([^@:]+):([^@]+)@/g, function(match, fontName, chars) {
        // Use a Private Use Area character as a unique placeholder
        const placeholder = String.fromCodePoint(0xE000 + fontCounter);
        fontCounter++;
        fontMappings.push({ placeholder, fontName, chars });
        return placeholder;
    });
    // ==========================================

    // ===== NEW: IDS sequence preprocessing =====
    const idsMappings = [];
    let idsCounter = 0;
    let newStr = '';
    let lastIdx = 0;
    const idsStartRegex = /[\u2FF0-\u2FFF\u31EF]/g;
    let m;
    while ((m = idsStartRegex.exec(str)) !== null) {
        const startIdx = m.index;
        newStr += str.slice(lastIdx, startIdx);
        const len = getIdsLength(str, startIdx);
        if (len) {
            const idsString = str.slice(startIdx, startIdx + len);
            // Use a different PUA range than the font placeholders (U+E200+)
            const placeholder = String.fromCodePoint(0xE200 + idsCounter);
            idsCounter++;
            idsMappings.push({ placeholder, idsString });
            newStr += placeholder;
            lastIdx = startIdx + len;
            idsStartRegex.lastIndex = lastIdx;
        } else {
            // Not a valid IDS, just copy the char
            newStr += str[startIdx];
            lastIdx = startIdx + 1;
            idsStartRegex.lastIndex = lastIdx;
        }
    }
    newStr += str.slice(lastIdx);
    str = newStr;

    let arr = [...str];
    for (let i = 0, lastBracketIndex = -1; i < arr.length; i++) {
        if (leftBrackets.includes(arr[i])) lastBracketIndex = i;
        if (lastBracketIndex === -1) {
            if (isKana(arr[i])) arr[i] = `{${arr[i]}}`;
            else arr[i] = `“⌊${arr[i]}⌋”`;
        }
        if (rightBrackets.includes(arr[i])) lastBracketIndex = -1;
    }
    str = arr.join('');
    str = str.replace(/}{/g, '');
    str = str.replace(new RegExp(`”([${leftBracketsStr}])`, 'g'), '$1');
    str = str.replace(new RegExp(`([${rightBracketsStr}])(“)`, 'g'), '$1”$2');
    if (rightBrackets.includes(str.slice(-1))) str += '”';
    str = str.replace(/⌊‘⌋”/g, '‘');
    str = str.replace(/“⌊’⌋/g, '’');
    str = str.replace(new RegExp(`”“⌊([${punctuationStr}])⌋`, 'g'), '⦉$1⦊');
    // now, str has been fully annotated

    // process other brackets
    str = str.replace(/“/g, '<ruby class="unit">');
    str = str.replace(/(unit">‘)/g, 'has-multiple-kanji $1');
    str = str.replace(/(unit">‘([^⌊’]*⌊){2}[^⌊’]*’)/g, 'has-2-kanji $1');
    str = str.replace(/(unit">‘([^⌊’]*⌊){3}[^⌊’]*’)/g, 'has-3-kanji $1');
    str = str.replace(/(unit">(‘[^’]*’)?[^‘”]*\()/g, 'has-furigana $1');
    str = str.replace(/(unit">(‘[^’]*’)?[^‘”]*\([^\)]\))/g, 'has-only-1-furigana $1');
    str = str.replace(/(unit">(‘[^’]*’)?[^‘”]*\([^\)][^\)]?\))/g, 'has-less-than-3-furigana $1');
    str = str.replace(/(unit">(‘[^’]*’)?[^‘”]*”[^‘”]*has-furigana)/g, 'next-unit-has-furigana $1');
    str = str.replace(/(unit">(‘[^’]*’)?[^‘”]*\{)/g, 'has-okurigana $1');
    str = str.replace(/”/g, '</ruby>');
    str = str.replace(/⌊/g, '<rb class="kanji">');
    str = str.replace(/⌋/g, '</rb>');
    // no furigana, use no <ruby>
    while (str !== (str = str.replace(/(‘[^’]*<\/?)(ruby|rb)/g, '$1span'))); // inside kanji must have no ruby
    str = str.replace(/‘/g, '<rb class="kanji">');
    str = str.replace(/’/g, '</rb>');
    str = replaceBetween(str, '<ruby', '</ruby', /ruby|rb/g, 'span', function (s) { return !s.includes('('); });
    str = str.replace(/⦉/g, '<span class="kunten punctuation">');
    str = str.replace(/⦊/g, '</span>');
    str = str.replace(/(punctuation">)(〻)/g, 'ninojiten $1<sup>$2</sup>');
    str = str.replace(/(punctuation">―)/g, 'dash $1');
    str = str.replace(/(punctuation">…)/g, 'ellipsis $1');
    str = str.replace(/(punctuation">[」』])/g, 'right-corner-bracket $1');

    // process basic brackets
    str = str.replace(/\(/g, '<rt class="furigana">');
    str = str.replace(/\)/g, '</rt>');
    str = str.replace(/\{/g, '<span class="kunten okurigana"><sup>');
    str = str.replace(/\}/g, '</sup></span>');

    str = str.replace(/‹/g, '<span class="kunten has-furigana saidoku"><sub class="saidoku-furigana">');
    str = str.replace(/(saidoku">[^›]*)›«/g, 'has-okurigana $1</sub><sub class="saidoku-okurigana">');
    str = str.replace(/«/g, '<span class="kunten has-okurigana saidoku"><sub class="saidoku-okurigana">');
    str = str.replace(/[›»]/g, '</sub></span>');

    str = str.replace(/\[(.)\]/g, '<span class="kunten kaeriten"><sub>$1</sub></span>');
    str = str.replace(/\[(.)(レ)\]/g, '<span class="kunten kaeriten"><sub>$1</sub><sub>$2</sub></span>');
    str = str.replace(/(kaeriten"><sub)(>一)/g, '$1 class="ichiten"$2');

    // font‑spec postprocessing
    fontMappings.forEach(function(map) {
    str = str.split(map.placeholder).join(
        '<span data-font="' + map.fontName + '">' + map.chars + '</span>'
    );
});

    // ===== NEW: IDS placeholder replacement =====
    idsMappings.forEach(map => {
        // The placeholder will be inside something like <span class="kanji">placeholder</span>
        str = str.split(map.placeholder).join(map.idsString);
    });
    // ==========================================
    str = str.replace(/(<\/ruby>|<\/span>)(?=\s*<ruby|<span)/g, '$1&#8203;'); // zero-width space between adjacent ruby/span elements to prevent them from merging visually
    return str;
}

function convertKanbunDiv(div) {
    div.childNodes.forEach(function (p) { p.innerHTML = toHTML(p.textContent); });
}