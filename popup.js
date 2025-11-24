document.addEventListener("DOMContentLoaded", async function () {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id },
            function: extractBookNumberFromPage
        },
        async (result) => {
            let selectedText = result[0]?.result || "کتابی انتخاب نشده است.";
            document.getElementById("selectedText").innerText = selectedText;


            asliPish = modifyStr(selectedText[0]);
            rade = modifyStr(selectedText[1]);
            cutterText = modifyStr(selectedText[2]);

            console.log("af "+ asliPish, rade, cutterText)

            if (!asliPish) {
                document.getElementById("shelfResult").innerText = "عدد درستی پیدا نشد.";
                document.getElementById("shelfResult").style.display = "block";
                return;
            }

            // Fetch shelf mappings
            const response = await fetch("shelves_data.json");
            const shelves = await response.json();

            let foundShelf = null;
            for (let range in shelves) {
                bk = range.split(" ");
                hasAsli = false;
                hasRade = false;
                hasCutter = false;

                bk0 = bk[0].split("-");

                if (bk0.length == 1) {
                    if (isSame(asliPish, bk0[0]))
                        hasAsli = true;
                }
                else if (isBeforeStr(bk0[0], asliPish) && isBeforeStr(asliPish, bk0[1]))
                    hasAsli = true;

                if (bk.length == 1) {
                    hasRade = true;
                    hasCutter = true;
                }
                else {
                    bk1 = bk[1].slice(1).split("-");
                    if (bk1.length == 1) {
                        if (isSame(rade, bk1[0]))
                            hasRade = true;
                    }
                    else if (isBeforeStr(bk1[0], rade) && isBeforeStr(rade, bk1[1]))
                        hasRade = true;

                    if (bk.length == 2)
                        hasCutter = true;
                    else {
                        bk2 = bk[2].split("-");
                        if (bk2.length == 1) {
                            if (isSame(cutterText, bk2[0]))
                                hasCutter = true;
                        }
                        else if (isBeforeStr(bk2[0], cutterText) && isBeforeStr(cutterText, bk2[1]))
                            hasCutter = true;
                    }
                }

                // document.getElementById("shelfResult").innerText = hasAsli;
                
                if (hasAsli && hasRade && hasCutter) {
                    foundShelf = shelves[range];
                    break;
                }

            }

            [packageName, columnNum, row] = foundShelf.split("-");
            packageNum = pNametoNum(packageName)
            columnNum = Number(convertPersianToEnglish(columnNum));
            rowNum = Number(convertPersianToEnglish(row).slice(0, -1));
            side = row.slice(-1);
            side = side == 'ر' ? 'r' : 'l';
            
            const position = [packageNum, columnNum, rowNum, side];

            // Open map.html with highlight
            window.open(`map.html?highlight=${position}`, "_blank");
        }
    );
});

function modifyStr(str) {
    // Split into parts: non-numbers vs. numbers (Persian digits ۰-۹)
    parts = str.split(/([\u06F0-\u06F9]+)/);
    
    if (!/^[\u06F0-\u06F9]+$/.test(parts[0])) parts = parts.reverse();

    return parts.join('');
}

// function isBefore(str1, str2) {
//     parts1 = str1.split(/([\u06F0-\u06F9]+)/);
//     parts2 = str2.split(/([\u06F0-\u06F9]+)/);

//     for (let i in parts1){
//         if (/^[\u06F0-\u06F9]+$/.test(parts1[i]) && /^[\u06F0-\u06F9]+$/.test(parts2[i])){
//             if (parts1[i] > parts2[i])
//                 return false;
//         }
//         else if (!isBeforeStr(parts1[i], parts2[i]))
//             return false;  
//     }
//     return true;
// }

function isBeforeStr(str1, str2) {
    for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
        if (str1.charCodeAt(i) < str2.charCodeAt(i))
            return true;
        else if (str1.charCodeAt(i) > str2.charCodeAt(i))
            return false;
        else if (i == str1.length - 1)
            return true;
        
    }
    return false;
}

function isSame(str1, str2) {
    if (str1.length != str2.length)
        return false;

    for (let i = 0; i < str1.length; i++)
        if (str1.charCodeAt(i) != str2.charCodeAt(i))
            return false;
    return true;
}

// Converts Persian/Arabic digits to English digits
function convertPersianToEnglish(text) {
    const persianNumbers = "۰۱۲۳۴۵۶۷۸۹";
    const englishNumbers = "0123456789";

    return text.replace(/[۰-۹]/g, (char) =>
        englishNumbers[persianNumbers.indexOf(char)] || char
    );
}

async function extractBookNumberFromPage() {
    try {
        // 1) Try NOT-LOGGED-IN mode first
        const cutter = document.getElementById('CutterContainer');
        const rade = document.getElementById('RadeFContainer');
        const asli = document.getElementById('asliPish');

        if (cutter || rade || asli) {
            const clean = t => t?.replace(/[\u200C-\u200F\u202A-\u202E]/g, '')
                                 .replace(/\s+/g, '')
                                 .trim() || '';

            console.log("af "+ clean(asli?.textContent), clean(rade?.textContent), clean(cutter?.textContent))
            
            return [
                clean(asli?.textContent),
                clean(rade?.textContent),
                clean(cutter?.textContent)
            ];
        }

        // 2) Extract recordNumber
        let recordNumber = null;
        document.querySelectorAll('#tbl1 tr').forEach(tr => {
            const label = tr.querySelector('td:first-child')?.innerText.trim();
            if (label.includes('شماره رکورد')) {
                const val = tr.querySelector('td:nth-child(2) span')?.innerText || "";
                recordNumber = convertPersianToEnglish(val).replace(/\D/g, '');
            }
        });

        if (!recordNumber) {
            return window.getSelection().toString();
        }

        const url = `/Search/FSearch/GetBookDetailsN/?recordNumber=${recordNumber}&matId=1&OrgIDType=10000`;

        const response = await fetch(url, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest"
            },
            body: "{}"
        });

        const raw = await response.text();
        console.log("me "+ raw)

        // ---------- FIXED HERE: detect JSON inside HTML ----------
        let data = null;

        // Case 1: raw is pure JSON
        if (raw.trim().startsWith("[")) {
            data = JSON.parse(raw);
        } else {
            // Case 2: JSON is inside HTML → extract with regex
            const jsonMatch = raw.match(/\[.*\]/s);
            if (jsonMatch) {
                data = JSON.parse(jsonMatch[0]);
            }
        }

        if (!data) return ["", "", ""]; // nothing to parse

        const book = data[0];

        // Clean Persian invisible characters
        const clean = t => t?.replace(/[\u200C-\u200F\u202A-\u202E]/g, '')
                             .replace(/\s+/g, '')
                             .trim() || '';

        const AsliPish = clean(book.RadeAsliD);
        const RadeFContainer = clean(book.RadeFareiD);
        const CutterContainer = clean(book.ShomareKaterD);

        console.log("me "+ AsliPish, RadeFContainer, CutterContainer)
        
        return [AsliPish, RadeFContainer, CutterContainer];

    } catch (err) {
        console.error(err);
        return window.getSelection().toString();
    }
}


function pNametoNum(text) {
    return SHELF_NAMES.indexOf(text) + 1;
}
