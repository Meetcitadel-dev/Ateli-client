
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function inspectSheet() {
    try {
        const filePath = path.resolve(process.cwd(), 'sample item list.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        console.log('--- Inspecting Rows 1 to 5 ---');
        for (let r = 0; r < 5; r++) {
            let row = [];
            for (let c = 0; c < 10; c++) {
                const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
                row.push(cell ? cell.v : '');
            }
            console.log(`Row ${r}:`, row.join(' | '));
        }
    } catch (e) {
        console.error(e);
    }
}
inspectSheet();
