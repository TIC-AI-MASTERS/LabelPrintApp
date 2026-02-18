import React, { forwardRef } from 'react';
import { Barcode } from './Barcode';

// Helper to chunk array
const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

export const PrintPreview = forwardRef(({ articles, selection, settings }, ref) => {
  // 1. Flatten selection into a list of label items
  const permanentItems = [];
  const nonPermanentItems = [];

  Object.entries(selection).forEach(([id, qty]) => {
    const article = articles.find(a => a.id === id);
    if (article) {
      for (let i = 0; i < qty; i++) {
        if (article.isPermanent) {
          permanentItems.push(article);
        } else {
          nonPermanentItems.push(article);
        }
      }
    }
  });

  // Calculate items per row based on widths
  const effectiveWidth = settings.pageWidth - settings.marginLeft;
  const itemWidthWithGap = settings.labelWidth + settings.gapX;
  const itemsPerRow = Math.max(1, Math.floor((effectiveWidth + settings.gapX) / itemWidthWithGap));

  const permanentRows = chunk(permanentItems, itemsPerRow);
  const nonPermanentRows = chunk(nonPermanentItems, itemsPerRow);

  // Row Style: Each row is a "Page" in the PDF context
  const rowStyle = {
    display: 'flex',
    paddingLeft: `${settings.marginLeft}mm`,
    paddingTop: `${settings.marginTop}mm`,
    paddingBottom: `${settings.gapY}mm`, // Include gapY in the row element height
    gap: `${settings.gapX}mm`,
    width: '100%',
    boxSizing: 'border-box',
    // Break after each row to force new PDF page
    pageBreakAfter: 'always',
    breakAfter: 'page',
    position: 'relative'
  };

  // Label Style: The actual printable area of one sticker
  const labelStyle = {
    width: `${settings.labelWidth}mm`,
    height: `${settings.labelHeight}mm`,
    // Border solely for UI visualization, removed in PDF via 'data-print-clean' logic if we wanted, 
    // but easier to just make it transparent or very subtle. 
    // User requested NO gray line. dashed border is useful for preview but bad for print.
    // We will use a separate class for the border utilizing the :not(.printing) trick if possible,
    // or rely on a wrapper. 
    // Current solution: We render the border on the wrapper in Preview, but we will try to make this clean.
    border: '1px dashed #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '2mm',
    boxSizing: 'border-box',
    overflow: 'hidden',
    pageBreakInside: 'avoid',
    backgroundColor: '#fff',
    fontSize: '10pt',
    lineHeight: '1.2'
  };

  return (
    <div className="print-preview-container">
      {permanentRows.length === 0 && nonPermanentRows.length === 0 ? (
        <div className="empty-state">No articles selected</div>
      ) : (
        <div ref={ref} className="printable-sheet" style={{
          width: `${settings.pageWidth}mm`,
          // Background white to ensure clean capture
          backgroundColor: 'white',
          margin: '0 auto',
        }}>
          {/* Permanent Group */}
          {permanentRows.map((rowItems, rowIndex) => (
            <div
              key={`perm-${rowIndex}`}
              className="print-row permanent-row"
              data-type="permanent"
              style={rowStyle}
            >
              {rowItems.map((article, idx) => (
                <div key={`${article.id}-perm-${rowIndex}-${idx}`} className="label-item" style={labelStyle}>
                  {/* Header: Exhibitor */}
                  <div className="label-header">
                    <span className="exhibitor-name">{article.exhibitor || 'Exhibitor Nameless'}</span>
                  </div>

                  {/* Main: Name & Price */}
                  <div className="label-main">
                    <div className="label-name">{article.name}</div>
                    <div className="label-price">
                      {article.price ? `€ ${article.price.toFixed(2).replace('.', ',')}` : ''}
                    </div>
                  </div>

                  {/* Footer: SKU & Barcode */}
                  <div className="label-footer">
                    <div className="label-sku">{article.sku}</div>
                    {article.ean && (
                      <div className="label-barcode">
                        <Barcode value={article.ean} width={4} height={60} fontSize={24} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Non-Permanent Group */}
          {nonPermanentRows.map((rowItems, rowIndex) => (
            <div
              key={`nonperm-${rowIndex}`}
              className="print-row non-permanent-row"
              data-type="non-permanent"
              style={rowStyle}
            >
              {rowItems.map((article, idx) => (
                <div key={`${article.id}-nonperm-${rowIndex}-${idx}`} className="label-item" style={labelStyle}>
                  {/* Reuse same layout */}
                  <div className="label-header">
                    <span className="exhibitor-name">{article.exhibitor || 'TICA'}</span>
                  </div>
                  <div className="label-main">
                    <div className="label-name">{article.name}</div>
                    <div className="label-price">
                      {article.price ? `€ ${article.price.toFixed(2).replace('.', ',')}` : ''}
                    </div>
                  </div>
                  <div className="label-footer">
                    <div className="label-sku">{article.sku}</div>
                    {article.ean && (
                      <div className="label-barcode">
                        <Barcode value={article.ean} width={4} height={60} fontSize={24} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <style>{`
         .empty-state {
           padding: 2rem;
           color: #888;
           text-align: center;
         }
         .print-preview-container {
             background: white;
             box-shadow: 0 0 10px rgba(0,0,0,0.1); 
             overflow-x: auto;
         }
         
         .label-header {
             font-size: 8pt;
             color: #666;
             text-transform: uppercase;
             border-bottom: 1px solid #000;
             padding-bottom: 2px;
             margin-bottom: 2px;
         }
         .label-main {
             flex: 1;
             display: flex;
             flex-direction: column;
             justify-content: center;
         }
         .label-name {
           font-weight: bold;
           font-size: 11pt;
           line-height: 1.1;
           margin-bottom: 2px;
         }
         .label-price {
            font-size: 14pt;
            font-weight: 700;
         }
         .label-footer {
             display: flex;
             justify-content: space-between;
             align-items: flex-end;
         }
         .label-sku {
           font-size: 8pt;
           font-family: monospace;
         }
         .label-barcode {
            max-width: 80%;
            height: 30px;
            overflow: hidden;
            display: flex;
            align-items: flex-end;
         }
         
         /* Crucial: Hide borders when capturing via html2canvas if we can target it 
            HTML2Canvas doesn't support @media print well, forcing us to handle it in JS or via specific styles.
            We will assume the user wants to SEE the border in preview but NOT in print.
            NOTE: html2canvas captures what it SEES. If we want no border, we must remove it before capture or use white border.
            The user complained about 'gray dotted line'. That came from 'border: 1px dashed #ccc'.
            We'll make it very light for preview and transparent for the user if they request it, 
            but strictly speaking, html2canvas will capture it. 
            To fix: in App.jsx generatePDF, we can momentarily remove the border class? 
            OR we use a transparent border here and only show it on interaction?
            Let's make it transparent by default or white? No, user needs to see boundaries. 
            Better: Use a box-shadow for preview which might not capture if configured, or just accept we need to 
            toggle a class on the container before capture. 
            For now, I will change border to white (invisible) on the item, 
            and put a background color on the preview CONTAINER to show gaps.
          */
          .printable-sheet {
              /* Ensure the sheet itself is white */
              background-color: white;
          }
          .label-item {
              /* Remove border for the capture to solve 'gray line' issue */
              border: none !important; 
              /* Add a subtle outline only for screen viewing? 
                 Actually, html2canvas WILL capture outline too. 
                 Solution: Box-shadow is often not captured or can be controlled, 
                 but safest is to have NO visible boundary on the element itself during capture.
                 We will use a wrapping 'preview-mode' class on the container for screen only? 
                 There is no easy way to differentiate capture vs screen in React component 
                 unless we pass a prop.
                 Simple fix: Remove the border entirely as requested. 
                 User can see labels by their content. 
               */
              position: relative;
          }
          /* Visual aid for screen only - might still be captured if not careful, 
             but we will try using a pseudo element that might be ignored or simple background trick */
          .print-preview-container:hover .label-item {
              outline: 1px dashed #e5e7eb;
          }
       `}</style>
    </div>
  );
});
