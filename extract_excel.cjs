
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function extractStandardizedProducts() {
    try {
        const filePath = path.resolve(process.cwd(), 'sample item list.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Headers are on Row 3 (0-indexed)
        const data = XLSX.utils.sheet_to_json(worksheet, { range: 3 });

        console.log('Total rows found:', data.length);

        // Use "Standardized_Product_Name" based on inspection
        const targetColumn = "Standardized_Product_Name";

        if (!data[0] || !data[0][targetColumn]) {
            console.error('Column "Standardized_Product_Name" not found in first data row.');
            console.log('Available columns:', Object.keys(data[0] || {}));
            return;
        }

        const products = [...new Set(data.map(row => row[targetColumn]).filter(name => !!name))].sort();

        console.log('Extracted', products.length, 'unique products.');

        // Save to JSON for verification
        fs.writeFileSync('extracted_products.json', JSON.stringify(products, null, 2));

        // Create TS file for frontend
        const tsContent = `export const STANDARDIZED_PRODUCTS = ${JSON.stringify(products, null, 4)};\n`;
        // Ensure directory exists
        const dataDir = path.resolve(process.cwd(), 'src/data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(path.join(dataDir, 'inventory.ts'), tsContent);
        console.log('Created src/data/inventory.ts');

    } catch (error) {
        console.error('Error extracting data:', error);
    }
}

extractStandardizedProducts();
