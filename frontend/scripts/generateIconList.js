const fs = require('fs');
const path = require('path');

const scssPath = path.join(__dirname, '../../node_modules/@mdi/font/scss/_variables.scss');
const outputPath = path.join(__dirname, '../src/assets/mdi-icons.json');

try {
    const content = fs.readFileSync(scssPath, 'utf8');
    const startMarker = '$mdi-icons: (';
    const endMarker = ');';
    
    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker, startIdx);
    
    if (startIdx === -1 || endIdx === -1) {
        console.error('Could not find $mdi-icons map in _variables.scss');
        process.exit(1);
    }
    
    const iconsMapContent = content.substring(startIdx + startMarker.length, endIdx);
    const iconLines = iconsMapContent.split('\n');
    
    const icons = iconLines
        .map(line => {
            const match = line.match(/"([^"]+)":/);
            return match ? `mdi-${match[1]}` : null;
        })
        .filter(icon => icon !== null);
    
    fs.writeFileSync(outputPath, JSON.stringify(icons, null, 2));
    console.log(`Successfully generated ${icons.length} icons to ${outputPath}`);
} catch (error) {
    console.error('Error generating icon list:', error);
    process.exit(1);
}
