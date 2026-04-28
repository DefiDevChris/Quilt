const fs = require('fs');

let code = fs.readFileSync('src/components/picture-my-blocks/PictureMyBlocksApp.tsx', 'utf8');

// Replace the on-point section with real implementation
const gridReplacement = `    if (layoutMode === 'grid') {`;
const onPointReplacement = `      for (let r = 0; r < long; r++) {
        for (let c = 0; c < across; c++) {
          const x = offsetX + (borderInches + c * (blockSizeInches + sashingInches)) * scale;
          const y = offsetY + (borderInches + r * (blockSizeInches + sashingInches)) * scale;
          const cellId = \`cell-\${r}-\${c}\`;

          const blockRect = new fabric.Rect({
            left: x,
            top: y,
            width: blockSizeInches * scale,
            height: blockSizeInches * scale,
            fill: COLORS.surface,
            stroke: COLORS.border,
            strokeWidth: 1,
            selectable: false,
            name: cellId,
            hoverCursor: 'pointer',
          });

          canvas.add(blockRect);

          const blockId = cellBlocks[cellId];
          if (blockId) {
            const blockObj = allBlocks.find(b => b.id === blockId);
            if (blockObj && ((blockObj as any).photoUrl || blockObj.thumbnailUrl)) {
               fabric.FabricImage.fromURL(((blockObj as any).photoUrl || blockObj.thumbnailUrl) as string).then((img: fabric.FabricImage) => {
                 const sX = (blockSizeInches * scale) / (img.width || 1);
                 const sY = (blockSizeInches * scale) / (img.height || 1);

                 img.set({
                   left: x,
                   top: y,
                   scaleX: sX,
                   scaleY: sY,
                   selectable: false,
                   evented: false
                 });
                 canvas.add(img);
                 canvas.requestRenderAll();
               });
            }
          } else {
             const text = new fabric.Text('Drop Block', {
               left: x + (blockSizeInches * scale) / 2,
               top: y + (blockSizeInches * scale) / 2,
               originX: 'center',
               originY: 'center',
               fontSize: 14 * (scale / 10),
               fill: COLORS.textDim,
               selectable: false,
               evented: false,
             });
             canvas.add(text);
          }
        }
      }
    } else {
       // On-point layout
       const diagonal = blockSizeInches * Math.sqrt(2);
       // The number of full blocks horizontally is across.
       // We'll stagger them.
       // Simplest on-point: block centers are spaced diagonally.

       for (let r = 0; r < long; r++) {
         for (let c = 0; c < across; c++) {
           // Offset every other row
           const xOffset = (r % 2 === 1) ? (diagonal + sashingInches) / 2 : 0;

           const xCenter = offsetX + (borderInches + c * (diagonal + sashingInches) + xOffset + diagonal/2) * scale;
           const yCenter = offsetY + (borderInches + r * (diagonal + sashingInches) / 2 + diagonal/2) * scale;

           const cellId = \`cell-\${r}-\${c}\`;

           const blockRect = new fabric.Rect({
             left: xCenter,
             top: yCenter,
             originX: 'center',
             originY: 'center',
             width: blockSizeInches * scale,
             height: blockSizeInches * scale,
             angle: 45,
             fill: COLORS.surface,
             stroke: COLORS.border,
             strokeWidth: 1,
             selectable: false,
             name: cellId,
             hoverCursor: 'pointer',
           });
           canvas.add(blockRect);

           const blockId = cellBlocks[cellId];
           if (blockId) {
             const blockObj = allBlocks.find(b => b.id === blockId);
             if (blockObj && ((blockObj as any).photoUrl || blockObj.thumbnailUrl)) {
                fabric.FabricImage.fromURL(((blockObj as any).photoUrl || blockObj.thumbnailUrl) as string).then((img: fabric.FabricImage) => {
                  const sX = (blockSizeInches * scale) / (img.width || 1);
                  const sY = (blockSizeInches * scale) / (img.height || 1);

                  img.set({
                    left: xCenter,
                    top: yCenter,
                    originX: 'center',
                    originY: 'center',
                    scaleX: sX,
                    scaleY: sY,
                    angle: 45,
                    selectable: false,
                    evented: false
                  });
                  canvas.add(img);
                  canvas.requestRenderAll();
                });
             }
           } else {
             const text = new fabric.Text('Drop', {
               left: xCenter,
               top: yCenter,
               originX: 'center',
               originY: 'center',
               fontSize: 14 * (scale / 10),
               fill: COLORS.textDim,
               selectable: false,
               evented: false,
             });
             canvas.add(text);
           }
         }
       }
    }`;

code = code.replace(/for \(let r = 0; r < long; r\+\+\) \{[\s\S]*canvas\.add\(text\);\n    \}/, onPointReplacement);

// Fix flex-wrap for top bar
code = code.replace(/<div className="h-16 flex-shrink-0 border-b border-\[var\(--color-border\)\]\/15 bg-white flex items-center px-6 gap-6 overflow-x-auto">/g, '<div className="min-h-16 flex-shrink-0 border-b border-[var(--color-border)]/15 bg-white flex flex-wrap items-center px-6 py-2 gap-6 overflow-x-auto">');

// Add upload button
const uploadBtnStr = `      <aside className="w-[320px] h-full flex-shrink-0 border-r border-[var(--color-border)]/15 flex flex-col bg-white">
        <div className="p-4 border-b border-[var(--color-border)]/15 flex justify-between items-center">
          <span className="font-bold">My Blocks</span>
          <button className="bg-primary text-white text-xs px-2 py-1 rounded">Upload Block</button>
        </div>`;
code = code.replace(/<aside className="w-\[320px\] h-full flex-shrink-0 border-r border-\[var\(--color-border\)\]\/15 flex flex-col bg-white">\s*<div className="p-4 border-b border-\[var\(--color-border\)\]\/15 font-bold">\s*My Blocks\s*<\/div>/, uploadBtnStr);

fs.writeFileSync('src/components/picture-my-blocks/PictureMyBlocksApp.tsx', code);
