import os
import zipfile
import base64
import json
import subprocess

ROOT_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
ARTIFACT_DIR = '/.aistudio/artifacts/brain/d5720dbc-ed35-4678-8aae-8c683916ad38'

# Directories to exclude from source zip
EXCLUDE_DIRS = {
    'node_modules',
    '.git',
    '.aistudio',
    'dist',
    '.cache',
    '__pycache__',
    '.tempmediaStorage',
    'aistudio',        # chat feedback screenshots / videos
}

# File extensions to exclude from source zip
EXCLUDE_EXTS = {
    '.zip',
    '.mp4',
    '.mov',
    '.avi',
    '.mkv',
    '.webm',
}

# Specific large generated files to exclude from source code zip
EXCLUDE_FILES = {
    'download.html',
    'download-offline.html',
    'zip_base64.js',
    'KurdChat_Domino_Source_Code.pdf_4386d02a.html',
}

# 1. First build the clean source code ZIP
src_zip_paths = [
    os.path.join(ROOT_DIR, 'public', 'kurd-chat-project.zip'),
    os.path.join(ROOT_DIR, 'public', 'KurdChat_Domino_Source_Code.zip'),
    os.path.join(ARTIFACT_DIR, 'kurd-chat-project.zip'),
    os.path.join(ARTIFACT_DIR, 'KurdChat_Domino_Source_Code.zip'),
]

for zip_path in src_zip_paths:
    os.makedirs(os.path.dirname(zip_path), exist_ok=True)
    print(f"Creating source ZIP: {zip_path}")
    
    file_count = 0
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        for root, dirs, files in os.walk(ROOT_DIR):
            # Prune excluded directories
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

            for file in files:
                if file in EXCLUDE_FILES:
                    continue
                _, ext = os.path.splitext(file)
                if ext.lower() in EXCLUDE_EXTS:
                    continue

                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, ROOT_DIR)
                
                zipf.write(full_path, rel_path)
                file_count += 1

    file_size = os.path.getsize(zip_path)
    print(f"Packed {file_count} source files into {zip_path} ({file_size / 1024:.1f} KB)")

# 2. Build production assets using vite build
print("Running production build...")
subprocess.run(["npm", "run", "build"], cwd=ROOT_DIR, check=True)

# 3. Create Cloudflare Pages ready ZIP (contains compiled dist/ files, ready to upload directly to Cloudflare Pages)
cf_zip_paths = [
    os.path.join(ROOT_DIR, 'public', 'kurd-chat-cloudflare-pages.zip'),
    os.path.join(ARTIFACT_DIR, 'kurd-chat-cloudflare-pages.zip'),
]

dist_dir = os.path.join(ROOT_DIR, 'dist')
if os.path.exists(dist_dir):
    for cf_zip in cf_zip_paths:
        os.makedirs(os.path.dirname(cf_zip), exist_ok=True)
        print(f"Creating Cloudflare Pages direct upload ZIP: {cf_zip}")
        dist_file_count = 0
        with zipfile.ZipFile(cf_zip, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
            for root, dirs, files in os.walk(dist_dir):
                # Exclude any huge zip/video files if present in dist
                dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
                for file in files:
                    if file in EXCLUDE_FILES or file.endswith('.zip') or file.endswith('.mp4'):
                        continue
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, dist_dir)
                    zipf.write(full_path, rel_path)
                    dist_file_count += 1
        cf_size = os.path.getsize(cf_zip)
        print(f"Packed {dist_file_count} compiled files into {cf_zip} ({cf_size / 1024:.1f} KB)")

# Write metadata for artifact files
def write_meta(path, summary):
    meta_path = path + '.metadata.json'
    meta_content = {
        "summary": summary,
        "userFacing": True,
        "requestFeedback": False
    }
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta_content, f, indent=2, ensure_ascii=False)

write_meta(
    os.path.join(ARTIFACT_DIR, 'kurd-chat-project.zip'),
    "Complete Kurd Chat & Domino clean source code ZIP archive (ultra-compact, <1MB, excludes large media recordings, 100% Cloudflare Pages compatible)."
)
write_meta(
    os.path.join(ARTIFACT_DIR, 'kurd-chat-cloudflare-pages.zip'),
    "Cloudflare Pages direct-upload ready production build ZIP. Unzip and drag the files into Cloudflare Pages 'Deploy a site by uploading your project' for 100% instant deployment."
)
write_meta(
    os.path.join(ARTIFACT_DIR, 'KurdChat_Domino_Source_Code.zip'),
    "Full official source code package for Kurd Chat & Domino Game with real-time Express backend, Kurdish voice chat, stories, and offline installation."
)

print("Updating base64 module for offline downloader...")
src_zip = os.path.join(ROOT_DIR, 'public', 'kurd-chat-project.zip')
with open(src_zip, 'rb') as f:
    b64_str = base64.b64encode(f.read()).decode('utf-8')

b64_js_path = os.path.join(ROOT_DIR, 'scripts', 'zip_base64.js')
with open(b64_js_path, 'w', encoding='utf-8') as f:
    f.write(f'export const PROJECT_ZIP_BASE64 = "{b64_str}";\n')
print(f"Generated Base64 module: {b64_js_path} (length: {len(b64_str)})")

print("All archives successfully built!")
