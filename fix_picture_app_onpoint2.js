const fs = require('fs');

let code = fs.readFileSync('src/components/picture-my-blocks/PictureMyBlocksApp.tsx', 'utf8');
code = code.replace(/<button className="bg-primary text-white text-xs px-2 py-1 rounded">Upload Block<\/button>/, '<button type="button" className="bg-primary text-white text-xs px-2 py-1 rounded">Upload Block</button>');
fs.writeFileSync('src/components/picture-my-blocks/PictureMyBlocksApp.tsx', code);
