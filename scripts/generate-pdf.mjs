import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const PDF_OUTPUT = path.join(PUBLIC_DIR, 'KurdChat_Domino_Source_Code.pdf');
const HTML_OUTPUT = path.join(PUBLIC_DIR, 'source-code.html');

const SOURCE_FILES = [
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'index.html',
  'server.ts',
  'src/index.css',
  'src/main.tsx',
  'src/App.tsx',
  'src/types/domino.ts',
  'src/types/chat.ts',
  'src/types/gifts.ts',
  'src/utils/dominoLogic.ts',
  'src/utils/audio.ts',
  'src/utils/i18n.ts',
  'src/utils/sync.ts',
  'src/utils/audioRecorder.ts',
  'src/utils/usePWAInstall.ts',
  'src/data/mockData.ts',
  'src/data/voiceGiftsData.ts',
  'src/components/DominoLiveView.tsx',
  'src/components/DominoTileView.tsx',
  'src/components/BottomNavBar.tsx',
  'src/components/ChatList.tsx',
  'src/components/ChatConversation.tsx',
  'src/components/AuthScreen.tsx',
  'src/components/CallScreen.tsx',
  'src/components/FriendsExploreView.tsx',
  'src/components/StoriesFeedView.tsx',
  'src/components/StoryViewer.tsx',
  'src/components/VoiceChatModal.tsx',
  'src/components/VoiceRoomGiftsSheet.tsx',
  'src/components/CoinWalletModal.tsx',
  'src/components/AdminPanelModal.tsx',
  'src/components/SettingsModal.tsx',
  'src/components/NewChatModal.tsx',
  'src/components/NotificationsModal.tsx',
  'src/components/NotificationToast.tsx',
  'src/components/LiveGiftAnimationOverlay.tsx',
  'src/components/StickerPicker.tsx',
  'src/components/KurdistanBadge.tsx',
  'src/components/KurdChatLogo.tsx',
  'src/components/PWAInstallButton.tsx',
];

console.log('Generating PDF and Printable Source Document...');

// 1. Generate Clean PDF Document
const doc = new PDFDocument({
  size: 'A4',
  margin: 36,
  bufferPages: true,
  info: {
    Title: 'Kurd Chat & Domino LIVE - Complete Source Code',
    Author: 'Sabah Sndi',
    Subject: 'Source code documentation',
  },
});

const fontMono = fs.existsSync('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf')
  ? '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
  : 'Courier';

const writeStream = fs.createWriteStream(PDF_OUTPUT);
doc.pipe(writeStream);

// Cover Page
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#09090d');

doc.fillColor('#f59e0b').fontSize(26).text('KURD CHAT & DOMINO LIVE', 50, 150, { align: 'center' });
doc.moveDown(0.5);
doc.fillColor('#ffffff').fontSize(16).text('Complete Application Source Code Document', { align: 'center' });
doc.moveDown(0.5);
doc.fillColor('#10b981').fontSize(12).text('Mobile-Friendly Full-Stack Kurdish Domino & Messaging App', { align: 'center' });

doc.moveDown(2);
doc.fillColor('#a1a1aa').fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
doc.text(`Total Project Source Files: ${SOURCE_FILES.length}`, { align: 'center' });
doc.text(`Super Admin / Developer: Sabah Sndi`, { align: 'center' });

doc.moveDown(3);
doc.fillColor('#e4e4e7').fontSize(11).text('Table of Contents:', 60);
doc.moveDown(0.5);

SOURCE_FILES.forEach((filePath, idx) => {
  doc.fillColor('#71717a').fontSize(9).text(`${(idx + 1).toString().padStart(2, '0')}. ${filePath}`, 70);
});

// Document Content Pages
SOURCE_FILES.forEach((relPath) => {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) return;

  const content = fs.readFileSync(fullPath, 'utf-8');
  doc.addPage();

  // Header Banner
  doc.rect(36, 36, doc.page.width - 72, 32).fill('#181824');
  doc.fillColor('#f59e0b').fontSize(11).text(`File: ${relPath}`, 46, 46);

  doc.moveDown(2.5);

  // Print code lines
  const lines = content.split('\n');
  doc.font(fontMono).fontSize(7.5).fillColor('#27272a');

  lines.forEach((line, i) => {
    const lineNum = (i + 1).toString().padStart(4, ' ');
    // Clean string for PDF safety
    const safeLine = line.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    try {
      doc.text(`${lineNum} | ${safeLine}`, { lineBreak: false });
      doc.moveDown(0.3);
    } catch {
      // Skip problematic character if any
    }
  });
});

doc.end();

writeStream.on('finish', () => {
  console.log(`PDF successfully created: ${PDF_OUTPUT} (${fs.statSync(PDF_OUTPUT).size} bytes)`);
});

// 2. Generate HTML Print-Ready Document
let htmlContent = `<!DOCTYPE html>
<html lang="ku" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>Kurd Chat & Domino LIVE - Source Code Document</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      background: #09090d;
      color: #e4e4e7;
      margin: 0;
      padding: 24px;
      line-height: 1.4;
    }
    .header {
      background: #181822;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      text-align: center;
    }
    h1 { color: #f59e0b; margin: 0 0 8px 0; font-size: 24px; }
    .subtitle { color: #10b981; font-size: 14px; margin-bottom: 12px; }
    .meta { color: #a1a1aa; font-size: 12px; }
    .btn-print {
      display: inline-block;
      margin-top: 16px;
      padding: 10px 20px;
      background: #10b981;
      color: #000;
      font-weight: bold;
      border-radius: 8px;
      text-decoration: none;
      cursor: pointer;
    }
    .file-box {
      background: #121218;
      border: 1px solid #27272a;
      border-radius: 8px;
      margin-bottom: 32px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .file-header {
      background: #1c1c24;
      border-bottom: 1px solid #27272a;
      padding: 10px 16px;
      font-weight: bold;
      color: #f59e0b;
      display: flex;
      justify-content: space-between;
    }
    pre {
      margin: 0;
      padding: 16px;
      overflow-x: auto;
      font-size: 11px;
      color: #d4d4d8;
      tab-size: 2;
    }
    @media print {
      body { background: #fff; color: #000; }
      .header, .file-box { border: 1px solid #ccc; background: #fff; color: #000; }
      .file-header { background: #eee; color: #000; }
      pre { color: #000; font-size: 9px; }
      .btn-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Kurd Chat & Domino LIVE</h1>
    <div class="subtitle">Complete Source Code Document</div>
    <div class="meta">Developer: Sabah Sndi | Total Files: ${SOURCE_FILES.length} | Generated: ${new Date().toLocaleDateString()}</div>
    <button class="btn-print" onclick="window.print()">🖨️ چاپکردن یان داگرتن وەک PDF (Print / Save as PDF)</button>
  </div>
`;

SOURCE_FILES.forEach((relPath) => {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf-8');
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  htmlContent += `
  <div class="file-box" id="${relPath.replace(/\//g, '_')}">
    <div class="file-header">
      <span>📄 ${relPath}</span>
      <span style="color:#a1a1aa;font-weight:normal;">${content.split('\n').length} lines</span>
    </div>
    <pre><code>${escaped}</code></pre>
  </div>
  `;
});

htmlContent += `
</body>
</html>
`;

fs.writeFileSync(HTML_OUTPUT, htmlContent, 'utf-8');
console.log(`HTML Print-Ready Document created: ${HTML_OUTPUT}`);
