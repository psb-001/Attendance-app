function doPost(e) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(30000); // 30 sec lock

        // 1. Parse Data
        const data = JSON.parse(e.postData.contents);
        const action = data.action || 'submit';

        // 2. Open Sheet
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        
        // Map branch to specific abbreviations
        let shortBranch = data.branch;
        if (data.branch.includes('AI') || data.branch.includes('ML')) shortBranch = 'AIML';
        else if (data.branch.includes('Computer')) shortBranch = 'CE';
        else if (data.branch.includes('Information')) shortBranch = 'IT';
        else if (data.branch.includes('Electronic') || data.branch.includes('Telecommunication') || data.branch.includes('ENTC')) shortBranch = 'ENTC';
        else shortBranch = data.branch.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');

        // Make tab name shorter: "Chemistry - AIML - B1"
        const cleanSubject = data.subject.replace(/[^a-zA-Z0-9 ]/g, '');
        let titleString = `${cleanSubject} - ${shortBranch}`;
        const hasBatch = data.batch && data.batch !== 'undefined' && data.batch !== 'null';
        if (hasBatch) {
             titleString += ` - ${data.batch}`;
        }
        const sheetName = titleString.substring(0, 31);
        
        // Also build the old name (without batch) as a fallback for delete actions
        const oldSheetName = `${cleanSubject} - ${shortBranch}`.substring(0, 31);

        let sheet = ss.getSheetByName(sheetName);
        // If not found and this is a delete, try the old naming format too
        if (!sheet && action === 'delete' && hasBatch) {
            sheet = ss.getSheetByName(oldSheetName);
        }

        // Header Row Index (shifted down because of title rows)
        const HEADER_ROW = 4;

        // 3. Create Sheet if missing (Only for submit)
        if (!sheet) {
            if (action === 'delete') {
                return createJSONOutput('success', 'Sheet not found');
            }
            sheet = ss.insertSheet(sheetName);
            
            // Add Title Rows at the top
            sheet.getRange(1, 1).setValue(`Branch: ${data.branch}`).setFontWeight("bold").setFontSize(14).setFontColor("#3d637e");
            const batchText = hasBatch ? ` | Batch: ${data.batch}` : '';
            sheet.getRange(2, 1).setValue(`Subject: ${data.subject}${batchText}`).setFontWeight("bold").setFontSize(12).setFontColor("#555555");
            
            // Add Table Headers at Row 4
            sheet.getRange(HEADER_ROW, 1).setValue("Roll No").setFontWeight("bold").setBackground("#f0f0f0");
            sheet.getRange(HEADER_ROW, 2).setValue("Name").setFontWeight("bold").setBackground("#f0f0f0");
            sheet.getRange(HEADER_ROW, 3).setValue("Total Lectures").setFontWeight("bold").setBackground("yellow");
            sheet.getRange(HEADER_ROW, 4).setValue("Percentage").setFontWeight("bold").setBackground("yellow");
            
            // Freeze rows up to HEADER_ROW, freeze first 2 columns
            sheet.setFrozenRows(HEADER_ROW);
            sheet.setFrozenColumns(2);
        }

        // 4. Map Rows (Roll No -> Row Index)
        const lastRow = sheet.getLastRow();
        const rollNoMap = {};

        // Read all roll numbers starting AFTER the header row
        if (lastRow > HEADER_ROW) {
            const rollVals = sheet.getRange(HEADER_ROW + 1, 1, lastRow - HEADER_ROW, 1).getValues();
            for (let i = 0; i < rollVals.length; i++) {
                const rNo = rollVals[i][0];
                if (rNo) rollNoMap[rNo] = i + HEADER_ROW + 1;
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
        if (lastCol === 0) return createJSONOutput('error', 'Sheet is empty');

        const headers = sheet.getRange(HEADER_ROW, 1, 1, lastCol).getValues()[0];

        const compositeHeader = data.date; 
        let dateColIndex = -1;
        let totalColIndex = -1;
        let percColIndex = -1;

        for (let i = 0; i < headers.length; i++) {
            const h = headers[i];
            const headerStr = (h instanceof Date) 
                ? Utilities.formatDate(h, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd") 
                : String(h);
            if (headerStr === compositeHeader) dateColIndex = i + 1;
            if (headerStr === "Total Lectures") totalColIndex = i + 1;
            if (headerStr === "Percentage") percColIndex = i + 1;
        }

        // Recover missing standard columns
        if (totalColIndex == -1) {
            totalColIndex = sheet.getLastColumn() + 1;
            sheet.getRange(HEADER_ROW, totalColIndex).setValue("Total Lectures").setBackground("yellow");
        }
        if (percColIndex == -1) {
            percColIndex = totalColIndex + 1;
            sheet.getRange(HEADER_ROW, percColIndex).setValue("Percentage").setBackground("yellow");
        }

        // --- HANDLE DELETE ACTION ---
        if (action === 'delete') {
            if (dateColIndex > -1) {
                sheet.deleteColumn(dateColIndex);
                if (dateColIndex < totalColIndex) {
                    totalColIndex--;
                    percColIndex--;
                }
            } else {
                return createJSONOutput('success', 'Date column not found, nothing to delete');
            }
        }
        // --- HANDLE SUBMIT ACTION ---
        else {
            if (dateColIndex == -1) {
                sheet.insertColumnBefore(totalColIndex);
                dateColIndex = totalColIndex;
                totalColIndex++;
                percColIndex++;
                sheet.getRange(HEADER_ROW, dateColIndex).setValue(compositeHeader).setFontWeight("bold");
            }

            // 7. Write Data with Colors (SKIP for delete)
            if (data.studentStatuses) {
                data.studentStatuses.forEach(student => {
                    const row = rollNoMap[student.rollNo];
                    if (row) {
                        const cell = sheet.getRange(row, dateColIndex);
                        cell.setValue(student.status);
                        
                        // Add green/red styling directly to the cell block
                        if (student.status === 1) {
                            cell.setBackground("#a5d6a7"); // Solid Light Green
                        } else {
                            cell.setBackground("#ef9a9a"); // Solid Light Red
                        }
                    }
                });
            }
        }

        // 8. Update Formulas for Total & Percentage
        const startColLetter = "C";
        if (totalColIndex > 3) {
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
