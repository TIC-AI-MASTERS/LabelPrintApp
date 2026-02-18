import React, { useState, useRef, useEffect } from 'react';
import { ARTICLES } from './data/articles';
import { SettingsPanel } from './components/SettingsPanel';
import { ArticleList } from './components/ArticleList';
import { PrintPreview } from './components/PrintPreview';
import { PrinterManager } from './components/PrinterManager';
import { db, initializeDB } from './db/db';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { qzTrayService } from './utils/qzTrayService';

function App() {
  // Print Settings State
  const [settings, setSettings] = useState({
    pageWidth: 101, // 49 + 3 + 49
    marginTop: 0,
    marginLeft: 0,
    gapX: 3,
    gapY: 0,
    labelWidth: 49,
    labelHeight: 29,
    activeGroupId: ''
  });

  // Articles State (loaded from data, but editable)
  const [articles, setArticles] = useState(ARTICLES);

  // Selected Articles State: map { articleId: quantity }
  const [selection, setSelection] = useState({});
  const [showPrinterManager, setShowPrinterManager] = useState(false);

  // Loading State
  const [isPrinting, setIsPrinting] = useState(false);

  const printRef = useRef();

  useEffect(() => {
    initializeDB().catch(console.error);
  }, []);

  const handleUpdateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: key === 'activeGroupId' ? value : (parseFloat(value) || 0) }));
  };

  const handleSelectArticle = (id, quantity) => {
    setSelection(prev => {
      const newSelection = { ...prev };
      if (quantity <= 0) {
        delete newSelection[id];
      } else {
        newSelection[id] = quantity;
      }
      return newSelection;
    });
  };

  const handleTogglePermanent = (id, isPermanent) => {
    setArticles(prev => prev.map(a =>
      a.id === id ? { ...a, isPermanent } : a
    ));
  };

  const generatePDF = async (rows, configWidth, configHeight) => {
    // Config should determine PDF size, or we use settings if manual overrides intended
    // Here we allow the global settings to drive the layout generation, 
    // but page size *could* come from the Printer Config if we wanted strict enforcement.
    // For now, consistent with existing logic, we use 'settings' for *layout* (gaps etc)
    // but we will use the *printer config* for the PDF page size if available, or fallback to settings.

    const w = configWidth || settings.pageWidth;
    const h = configHeight || (settings.labelHeight + settings.marginTop + settings.gapY);
    const orientation = w > h ? 'l' : 'p';

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: [w, h],
      compress: true // Enable PDF object compression
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const canvas = await html2canvas(row, {
        scale: 2, // Optimized for 203dpi (2x96=192dpi)
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: row.scrollWidth,
        windowHeight: row.scrollHeight
      });

      // OPTIMIZATION: Use JPEG instead of PNG to save size (2MB -> ~100KB)
      // Quality 0.8 is sufficient for thermal print
      const imgData = canvas.toDataURL('image/jpeg', 0.8);

      if (i > 0) {
        pdf.addPage([w, h], orientation);
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, w, h);
    }

    return pdf;
  };

  const handleDownloadPDF = async () => {
    const container = printRef.current;
    if (!container) return;
    const rows = container.querySelectorAll('.print-row');
    if (rows.length === 0) return alert("No labels to print!");

    const pdf = await generatePDF(rows, settings.pageWidth, null);
    pdf.save('labels.pdf');
  };

  const handlePrint = async () => {
    const container = printRef.current;
    if (!container) return;

    if (!settings.activeGroupId) {
      alert("Please select a Printer Location first!");
      return;
    }

    // Load active group config
    const activeGroup = await db.printerGroups.get(settings.activeGroupId);
    if (!activeGroup) {
      alert("Selected location not found. It might have been deleted.");
      return;
    }

    const permanentRows = container.querySelectorAll('.print-row[data-type="permanent"]');
    const nonPermanentRows = container.querySelectorAll('.print-row[data-type="non-permanent"]');

    if (permanentRows.length === 0 && nonPermanentRows.length === 0) {
      alert("No labels to print!");
      return;
    }

    setIsPrinting(true); // Start Loading
    try {
      // Job 1: Permanent
      if (permanentRows.length > 0) {
        if (!activeGroup.permanentPrinter.name) throw new Error("Permanent Printer not configured for this location.");

        console.time("PDF Generation (Permanent)");
        console.log("Generating Permanent PDF...");
        const pdf = await generatePDF(permanentRows, activeGroup.permanentPrinter.width, activeGroup.permanentPrinter.height);
        const dataUri = pdf.output('datauristring');
        const base64 = dataUri.split(',')[1];
        console.timeEnd("PDF Generation (Permanent)");

        console.time("PDF Print (Permanent)");
        console.log("Sending Permanent PDF to printer...");
        await qzTrayService.printPDF(base64, activeGroup.permanentPrinter);
        console.timeEnd("PDF Print (Permanent)");
        console.log("Permanent batch sent");
      }

      // Job 2: Non-Permanent
      if (nonPermanentRows.length > 0) {
        if (!activeGroup.nonPermanentPrinter.name) throw new Error("Non-Permanent Printer not configured for this location.");

        console.time("PDF Generation (Non-Permanent)");
        console.log("Generating Non-Permanent PDF...");
        const pdf = await generatePDF(nonPermanentRows, activeGroup.nonPermanentPrinter.width, activeGroup.nonPermanentPrinter.height);
        const dataUri = pdf.output('datauristring');
        const base64 = dataUri.split(',')[1];
        console.timeEnd("PDF Generation (Non-Permanent)");

        console.time("PDF Print (Non-Permanent)");
        console.log("Sending Non-Permanent PDF to printer...");
        await qzTrayService.printPDF(base64, activeGroup.nonPermanentPrinter);
        console.timeEnd("PDF Print (Non-Permanent)");
        console.log("Non-Permanent batch sent");
      }

      alert("Print jobs sent successfully!");

    } catch (error) {
      console.error("Print Error:", error);
      alert(`Printing failed: ${error.message || error}\n\nSee console for more details.`);
    } finally {
      setIsPrinting(false); // Stop Loading
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Price Label Printer</h1>
      </header>

      {/* Loading Overlay */}
      {isPrinting && (
        <div className="printing-overlay">
          <div className="printing-content">
            <div className="spinner"></div>
            <h2>Printing Labels...</h2>
            <p>Please wait while we generate and send the PDF.</p>
          </div>
          <style>{`
            .printing-overlay {
              position: fixed;
              top: 0; left: 0; right: 0; bottom: 0;
              background: rgba(0,0,0,0.7);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 9999;
              color: white;
            }
            .printing-content {
              text-align: center;
              background: #fff;
              color: #333;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            .spinner {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #3498db;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 1rem;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {showPrinterManager && <PrinterManager onClose={() => setShowPrinterManager(false)} />}

      <main className="main-content">
        <section className="left-panel">
          <ArticleList
            articles={articles}
            selection={selection}
            onSelect={handleSelectArticle}
            onTogglePermanent={handleTogglePermanent}
          />
        </section>

        <section className="right-panel">
          <div className="preview-controls">
            <SettingsPanel
              settings={settings}
              onUpdate={handleUpdateSetting}
              onDownload={handleDownloadPDF}
              onPrint={handlePrint}
              onManagePrinters={() => setShowPrinterManager(true)}
            />
          </div>
          <div className="print-area-wrapper">
            <PrintPreview
              ref={printRef}
              articles={articles}
              selection={selection}
              settings={settings}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
