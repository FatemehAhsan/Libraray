document.addEventListener("DOMContentLoaded", function () {
    const libraryContainer = document.getElementById("library");
    const shelfColumns = SHELF_COLUMNS;
    const shelfNames = SHELF_NAMES;  // 8 columns per package
    const shelfRows = SHELF_ROWS;     // 6 rows per column

    for (let p = 1; p <= SHELF_COLUMNS.length; p++) {
        const packageDiv = document.createElement("div");
        
        const table = document.createElement("table");
        table.classList.add("shelf-table");

        if (p === 2) {
            table.classList.add("rotated");
        }

        for (let c = 0; c < shelfColumns[p - 1]; c++) {
            // Shelf row
            const row = document.createElement("tr");
            row.innerText = e2p(String(shelfColumns[p - 1] - c));

            for (let r = 0; r < shelfRows[p - 1]; r++)
                row.appendChild(createTableCell(p, c, r, "l", shelfRows[p - 1]));

            for (let r = 0; r < shelfRows[p - 1]; r++) 
                row.appendChild(createTableCell(p, c, r, "r", shelfRows[p - 1]));

            table.appendChild(row);
        }

        packageDiv.appendChild(table);
        
        const title = document.createElement("div");
        title.innerText = shelfNames[p - 1];
        packageDiv.appendChild(title);

        libraryContainer.appendChild(packageDiv);

        if (p < shelfColumns.length) {
            const laneTable = document.createElement("table");
            for (let r = 0; r < shelfColumns[p - 1] * 2; r++) {
                const laneRow = document.createElement("tr");
                for (let i = 0; i < 2; i++){
                    const laneCell = document.createElement("td");
                    laneCell.className = "lane";
                    laneRow.appendChild(laneCell);
                }
                laneTable.appendChild(laneRow);
            }
            libraryContainer.appendChild(laneTable);
        }
    }

    // Highlight book shelf if book position is passed
    const urlParams = new URLSearchParams(window.location.search);
    const bookPosition = urlParams.get("highlight");
    if (bookPosition) {
        positions = bookPosition.split(',');
        packageNum = Number(positions[0]);
        columnNum = shelfColumns[packageNum - 1] - Number(positions[1]) + 1;
        rowNum = Number(positions[2]);
        side = positions[3]
        rowNum = side == 'l' ? shelfRows[packageNum - 1] - rowNum + 1 : rowNum;
         
        const position = `P${packageNum}-C${columnNum}-R${rowNum}-${side}`;
        // document.getElementById("library").innerText = position;
        
        const cells = document.querySelectorAll(`[data-position="${position}"]`);
        cells.forEach(cell => {
            cell.classList.add("highlight");
            cell.textContent = cell.dataset.rowNum;
            
            // Show column number in the row header
            const row = cell.closest('tr');
            if (row) {
                row.classList.add("highlight_tr");
            }
        });

        // // Show a friendly message
        // const message = document.createElement("div");
        // message.classList.add("highlight-message");
        // message.innerText = `📚 کتاب شما در بسته ${e2p(packageNum)}, ستون ${e2p(columnNum)}, ردیف ${e2p(rowNum)} است!`;
        // document.body.appendChild(message);

        // // Remove message after a few seconds
        // setTimeout(() => message.remove(), 5000);
    }
});

function createTableCell(packageNum, column, row, side, totalRows) {
    const cell = document.createElement("td");
    cell.dataset.position = `P${packageNum}-C${column + 1}-R${row + 1}-${side}`;
    cell.dataset.rowNum = e2p(side === 'l' ? String(totalRows - row) : String(row + 1));
    return cell;
}

// Converts Persian/Arabic digits to English digits
function e2p(text) {
    const persianNumbers = "۰۱۲۳۴۵۶۷۸۹";
    const englishNumbers = "0123456789";

    return text.replace(/[0-9]/g, (char) =>
        persianNumbers[englishNumbers.indexOf(char)] || char
    );
}
