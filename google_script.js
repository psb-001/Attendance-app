function doPost(e) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(30000); // 30 sec lock

        // 1. Parse Data
        const data = JSON.parse(e.postData.contents);
        const action = data.action || 'submit';

        // 2. Open Sheet
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheetName = "Division " + data.division;
        let sheet = ss.getSheetByName(sheetName);

        // 3. Create Sheet if missing (Only for submit)
        if (!sheet) {
            if (action === 'delete') {
                return createJSONOutput('success', 'Sheet not found');
            }
            sheet = ss.insertSheet(sheetName);
            sheet.getRange(1, 1).setValue("Roll No").setFontWeight("bold");
            sheet.getRange(1, 2).setValue("Name").setFontWeight("bold");
            sheet.getRange(1, 3).setValue("Total Lectures").setFontWeight("bold").setBackground("yellow");
            sheet.getRange(1, 4).setValue("Percentage").setFontWeight("bold").setBackground("yellow");
            sheet.setFrozenRows(1);
            sheet.setFrozenColumns(2);
        }

        // 4. Map Rows (Roll No -> Row Index)
        const lastRow = sheet.getLastRow();
        const rollNoMap = {};

        if (lastRow > 1) {
            const rollVals = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
            for (let i = 0; i < rollVals.length; i++) {
                const rNo = rollVals[i][0];
                if (rNo) rollNoMap[rNo] = i + 2;
            }
        }

        // 5. Ensure students exist (SKIP for delete)
        if (action !== 'delete' && data.studentStatuses) {
            data.studentStatuses.sort((a, b) => a.rollNo - b.rollNo);
            data.studentStatuses.forEach(student => {
                if (!rollNoMap[student.rollNo]) {
                    const newRow = sheet.getLastRow() + 1;
                    sheet.getRange(newRow, 1).setValue(student.rollNo);
                    sheet.getRange(newRow, 2).setValue(student.name);
                    rollNoMap[student.rollNo] = newRow;
                }
            });
        }

        // 6. Handle Columns (Find indices)
        const lastCol = sheet.getLastColumn();
        // Guard against empty sheet
        if (lastCol === 0) return createJSONOutput('error', 'Sheet is empty');

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

        let dateColIndex = -1;
        let totalColIndex = -1;
        let percColIndex = -1;

        for (let i = 0; i < headers.length; i++) {
            const h = headers[i];
            // Use helper to compare dates robustly
            if (isSameDate(h, data.date)) dateColIndex = i + 1;
            if (h === "Total Lectures") totalColIndex = i + 1;
            if (h === "Percentage") percColIndex = i + 1;
        }

        // Recover missing standard columns (if accidental deletion)
        if (totalColIndex == -1) {
            totalColIndex = sheet.getLastColumn() + 1;
            sheet.getRange(1, totalColIndex).setValue("Total Lectures").setBackground("yellow");
        }
        if (percColIndex == -1) {
            percColIndex = totalColIndex + 1;
            sheet.getRange(1, percColIndex).setValue("Percentage").setBackground("yellow");
        }

        // --- HANDLE DELETE ACTION ---
        if (action === 'delete') {
            if (dateColIndex > -1) {
                sheet.deleteColumn(dateColIndex);

                // Adjust indices: if we deleted a column to the left of Total, Total shifts left
                if (dateColIndex < totalColIndex) {
                    totalColIndex--;
                    percColIndex--;
                }

                // We do NOT return here. We proceed to Step 8 to update formulas.
            } else {
                return createJSONOutput('success', 'Date column not found, nothing to delete');
            }
        }
        // --- HANDLE SUBMIT ACTION ---
        else {
            // Insert NEW Date Column if needed
            if (dateColIndex == -1) {
                sheet.insertColumnBefore(totalColIndex);
                dateColIndex = totalColIndex;
                totalColIndex++;
                percColIndex++;
                sheet.getRange(1, dateColIndex).setValue(data.date).setFontWeight("bold");
            }

            // 7. Write Data (SKIP for delete)
            if (data.studentStatuses) {
                data.studentStatuses.forEach(student => {
                    const row = rollNoMap[student.rollNo];
                    if (row) {
                        sheet.getRange(row, dateColIndex).setValue(student.status);
                    }
                });
            }
        }

        // 8. Update Formulas for Total & Percentage
        // (We run this for BOTH submit and delete to ensure accuracy)

        const startColLetter = "C";
        // The data range ends at (TotalColumn - 1)
        // If TotalColumn is 3 (C), then data range is empty (invalid). 
        // We check if we have any data columns.

        if (totalColIndex > 3) { // Means we have at least 1 date column (at index 3 or more)
            const endColLetter = columnToLetter(totalColIndex - 1);
            const totalColLetter = columnToLetter(totalColIndex);

            const rowsToUpdate = Object.values(rollNoMap);
            rowsToUpdate.forEach(r => {
                const range = `${startColLetter}${r}:${endColLetter}${r}`;

                sheet.getRange(r, totalColIndex).setFormula(`=COUNTIF(${range}, 1)`);
                sheet.getRange(r, percColIndex).setFormula(`=IFERROR((${totalColLetter}${r} / COUNTA(${range})) * 100, 0)`);
                sheet.getRange(r, percColIndex).setNumberFormat("0.00");
            });
        } else {
            // No date columns left (all deleted). Reset Total/Perc to 0.
            const rowsToUpdate = Object.values(rollNoMap);
            rowsToUpdate.forEach(r => {
                sheet.getRange(r, totalColIndex).setValue(0);
                sheet.getRange(r, percColIndex).setValue(0);
            });
        }

        return createJSONOutput('success', action === 'delete' ? 'Entry deleted' : 'Attendance marked');

    } catch (e) {
        return createJSONOutput('error', e.toString());
    } finally {
        lock.releaseLock();
    }
}

function createJSONOutput(status, message) {
    return ContentService.createTextOutput(JSON.stringify({
        status: status,
        message: message
    })).setMimeType(ContentService.MimeType.JSON);
}

function columnToLetter(column) {
    let temp, letter = '';
    while (column > 0) {
        temp = (column - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        column = (column - temp - 1) / 26;
    }
    return letter;
}

function isSameDate(h, d) {
    if (!h || !d) return false;

    // Convert to string "YYYY-MM-DD"
    const formatDate = (val, tz) => {
        if (val instanceof Date) {
            return Utilities.formatDate(val, tz || Session.getScriptTimeZone(), "yyyy-MM-dd");
        }
        return String(val);
    };

    const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    return formatDate(h, tz) === formatDate(d, tz);
}
