import os
import base64
import json

ROOT_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
ARTIFACT_DIR = '/.aistudio/artifacts/brain/d5720dbc-ed35-4678-8aae-8c683916ad38'
ZIP_PATH = os.path.join(ROOT_DIR, 'public', 'kurd-chat-project.zip')

with open(ZIP_PATH, 'rb') as f:
    zip_bytes = f.read()
    b64_data = base64.b64encode(zip_bytes).decode('utf-8')

file_size_mb = round(len(zip_bytes) / (1024 * 1024), 2)
file_size_bytes = len(zip_bytes)

html_template = f'''<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>داگرتنی ڕاستەوخۆی پڕۆژەی Kurd Chat | Direct ZIP Downloader</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Vazirmatn", sans-serif;
      background: #09090d;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
      text-align: center;
    }}
    .card {{
      background: #12121a;
      border: 1px solid #232332;
      border-radius: 24px;
      padding: 28px 20px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 24px 48px rgba(0,0,0,0.7);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }}
    .badge {{
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.4);
      color: #c4b5fd;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
    }}
    .icon {{
      width: 68px;
      height: 68px;
      border-radius: 20px;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      box-shadow: 0 10px 25px rgba(16, 185, 129, 0.35);
    }}
    h1 {{ font-size: 21px; font-weight: 800; color: #fff; line-height: 1.4; }}
    p {{ font-size: 13px; color: #a1a1aa; line-height: 1.6; }}
    .btn {{
      width: 100%;
      padding: 16px 20px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: #000;
      font-size: 15px;
      font-weight: 900;
      border-radius: 16px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
      transition: all 0.2s;
    }}
    .btn:active {{ transform: scale(0.98); opacity: 0.9; }}
    .btn-secondary {{
      background: #1c1c28;
      color: #e4e4e7;
      border: 1px solid #2e2e40;
      box-shadow: none;
      font-size: 14px;
      padding: 13px 20px;
      text-decoration: none;
    }}
    .btn-secondary:hover {{
      background: #272738;
    }}
    .status {{
      font-size: 13px;
      color: #10b981;
      font-weight: 700;
      min-height: 22px;
    }}
    .meta-box {{
      background: #09090e;
      border: 1px solid #1c1c28;
      border-radius: 14px;
      padding: 14px;
      width: 100%;
      text-align: right;
      font-size: 12px;
      color: #9ca3af;
      line-height: 1.9;
    }}
    .highlight {{ color: #34d399; font-weight: 700; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Kurd Chat & Domino Live ☀️</div>
    <div class="icon">📦</div>
    <h1>داگرتنی تەواوی پڕۆژەی Kurd Chat</h1>
    <p>ئەم فایلە هەموو کۆدەکانی پڕۆژە، مۆبایل و کۆمپیوتەر، سێرڤەری Node/Express، یاریا دۆمینێ و داتابەیس لەخۆ دەگرێت.</p>

    <div class="meta-box">
      <div>• ناوی فایل: <strong class="highlight">kurd-chat-project.zip</strong></div>
      <div>• قەبارە: <strong>{file_size_mb} MB ({file_size_bytes:,} بایت)</strong></div>
      <div>• تایبەتمەندی: <strong>داگرتنی ڕاستەوخۆ بەبێ کێشەی Security Cookie</strong></div>
      <div>• ئامادەکراو بۆ: <strong>Google Chrome لەسەر ئەندرۆید و وێبگەڕەکان</strong></div>
    </div>

    <button id="downloadBtn" class="btn" onclick="saveZipOffline()">
      <span>📥 داگرتنی خێرای ZIP (کلیک بکە)</span>
    </button>

    <a href="/kurd-chat-project.zip" download="kurd-chat-project.zip" class="btn btn-secondary">
      <span>🌐 داگرتنی ئاسایی لە سێرڤەر (Direct Server Link)</span>
    </a>

    <div id="status" class="status">ئامادەیە بۆ داگرتن ✓</div>
  </div>

  <script>
    const B64_DATA = "{b64_data}";

    function base64ToBlob(b64Data, contentType = 'application/zip') {{
      const byteCharacters = atob(b64Data);
      const byteArrays = [];
      const sliceSize = 512;

      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {{
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {{
          byteNumbers[i] = slice.charCodeAt(i);
        }}
        byteArrays.push(new Uint8Array(byteNumbers));
      }}

      return new Blob(byteArrays, {{ type: contentType }});
    }}

    function saveZipOffline() {{
      const statusEl = document.getElementById('status');
      const btn = document.getElementById('downloadBtn');
      try {{
        statusEl.textContent = 'خەریکی دروستکردنی فایلی ZIP لەسەر مۆبایلەکەت...';
        btn.style.opacity = '0.7';

        const blob = base64ToBlob(B64_DATA, 'application/zip');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'kurd-chat-project.zip';
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {{
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          statusEl.textContent = 'داگرتن دەستی پێکرد و تەواو بوو! ✓';
          btn.style.opacity = '1';
        }}, 1200);
      }} catch (err) {{
        console.error(err);
        window.location.href = '/kurd-chat-project.zip';
        statusEl.textContent = 'کلیک لە بەستەری دووەم بکە ئەگەر دەستی پێنەکرد';
      }}
    }}

    // Auto-download on Android Chrome when opened directly
    window.addEventListener('load', () => {{
      setTimeout(saveZipOffline, 600);
    }});
  </script>
</body>
</html>
'''

# 1. Write to public/download-offline.html
public_offline_path = os.path.join(ROOT_DIR, 'public', 'download-offline.html')
with open(public_offline_path, 'w', encoding='utf-8') as f:
    f.write(html_template)
print(f"Updated {public_offline_path}")

# 2. Write to public/download.html as well
public_download_path = os.path.join(ROOT_DIR, 'public', 'download.html')
with open(public_download_path, 'w', encoding='utf-8') as f:
    f.write(html_template)
print(f"Updated {public_download_path}")

# 3. Write to active artifact directory: /.aistudio/artifacts/brain/d5720dbc-ed35-4678-8aae-8c683916ad38/kurd_chat_project_download.html
os.makedirs(ARTIFACT_DIR, exist_ok=True)
artifact_html_path = os.path.join(ARTIFACT_DIR, 'kurd_chat_project_download.html')
with open(artifact_html_path, 'w', encoding='utf-8') as f:
    f.write(html_template)
print(f"Created artifact: {artifact_html_path}")

# Metadata for html artifact
meta_html = {
    "summary": "Official interactive Kurd Chat & Domino complete project source code downloader for Android Chrome with zero cookie dependencies and direct one-click ZIP generation.",
    "userFacing": True,
    "requestFeedback": False
}
with open(artifact_html_path + '.metadata.json', 'w', encoding='utf-8') as f:
    json.dump(meta_html, f, indent=2, ensure_ascii=False)
print("Created metadata for html artifact")
