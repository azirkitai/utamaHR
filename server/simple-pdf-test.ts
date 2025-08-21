import puppeteer from 'puppeteer';

export async function generateSimplePDF(): Promise<Buffer> {
  console.log('Testing simple PDF generation...');
  
  const simpleHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Simple Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        p { margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Test PDF Report</h1>
    <p>This is a simple test to verify PDF generation works.</p>
    <p>Date: ${new Date().toLocaleDateString()}</p>
</body>
</html>`;

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();
  
  await page.setViewport({
    width: 800,
    height: 1200,
    deviceScaleFactor: 1
  });

  console.log('Setting content...');
  await page.setContent(simpleHTML, { waitUntil: 'networkidle0' });

  console.log('Generating PDF...');
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    }
  });

  await browser.close();
  
  console.log('Simple PDF generated, size:', pdfBuffer.length);
  return pdfBuffer;
}