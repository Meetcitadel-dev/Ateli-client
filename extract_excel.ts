
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

function extractStandardizedProducts() {
    try {
        const filePath = path.resolve(process.cwd(), 'sample item list.xlsx');
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            return;
        }

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log('Total rows found:', data.length);

        // Look for the "Standardized name" or "standardized product name" column
        // Based on common naming in such sheets
        const columnNames = Object.keys(data[0] || {});
        console.log('Available columns:', columnNames);

        const targetColumn = columnNames.find(col =>
            col.toLowerCase().includes('standardized product name') ||
            col.toLowerCase().includes('standardized name') ||
            col.toLowerCase().includes('product name')
        );

        if (!targetColumn) {
            console.error('Target column not found among:', columnNames);
            return;
        }

        console.log('Using column:', targetColumn);

        const products = [...new Set(data.map(row => row[targetColumn]).filter(name => !!name))].sort();

        console.log('Extracted', products.length, 'unique products.');

        // Write to a temporary JS file we can import in the frontend or just log
        fs.writeFileSync('extracted_products.json', JSON.stringify(products, null, 2));
        console.log('Saved to extracted_products.json');

    } catch (error) {
        console.error('Error extracting data:', error);
    }
}

extractStandardizedProducts();
