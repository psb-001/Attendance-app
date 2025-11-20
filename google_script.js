function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const action = data.action || 'submit'; // Default to 'submit'

        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheetName = "Division " + data.division;
        let sheet = ss.getSheetByName(sheetName);

        if (!sheet) {
            if (action === 'delete') {
                return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Sheet not found, nothing to delete' }))
                    .setMimeType(ContentService.MimeType.JSON);
            }
            sheet = ss.insertSheet(sheetName);
            sheet.appendRow(['Timestamp', 'Date', 'Subject', 'Total', 'Present', 'Absent', 'Percentage', 'Absent List']);
        }

        if (action === 'delete') {
            const lastRow = sheet.getLastRow();
            // Iterate backwards to find the latest entry for this date and subject
            for (let i = lastRow; i > 1; i--) {
                const rowDate = sheet.getRange(i, 2).getValue(); // Column 2 is Date
                const rowSubject = sheet.getRange(i, 3).getValue(); // Column 3 is Subject

                // Simple string comparison for date. 
                // Note: In a real app, robust date parsing might be needed depending on locale.
                // Here we assume the string format matches.
                if (rowDate.toString() === data.date && rowSubject === data.subject) {
                    sheet.deleteRow(i);
                    return ContentService.createTextOutput(JSON.stringify({
                        status: 'success',
                        message: 'Entry deleted'
                    })).setMimeType(ContentService.MimeType.JSON);
                }
            }
            return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Entry not found to delete' }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        // Default Action: Submit (Append Row)
        const timestamp = new Date();

        sheet.appendRow([
            timestamp,
            data.date,
            data.subject || 'N/A',
            data.total,
            data.present,
            data.absent,
            data.percentage,
            data.absentList
        ]);

        return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            spreadsheetName: ss.getName(),
            sheetName: sheet.getName(),
            spreadsheetUrl: ss.getUrl()
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}
