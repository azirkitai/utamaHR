import htmlToPdf from 'html-pdf-node';

export async function generatePayslipPDFAlternative(html: string): Promise<Buffer> {
  try {
    console.log('Generating PDF using html-pdf-node (alternative method)...');
    
    const options = {
      format: 'A4',
      width: '158mm', // 3/4 of A4 width  
      height: '223mm', // 3/4 of A4 height
      printBackground: true,
      margin: {
        top: '2mm',
        right: '2mm',
        bottom: '2mm',
        left: '2mm'
      }
    };

    const file = { content: html };
    const pdfBuffer = await htmlToPdf.generatePdf(file, options);
    
    console.log('PDF generated with html-pdf-node, buffer size:', pdfBuffer.length);
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating PDF with html-pdf-node:', error);
    throw error;
  }
}