import fs from 'fs';
import path from 'path';

const distDir = path.resolve(process.cwd(), 'dist');
const htdocsDir = path.resolve(process.cwd(), 'htdocs');

function processHtml(targetDir) {
  const htmlPath = path.join(targetDir, 'index.html');
  if (!fs.existsSync(htmlPath)) return;

  let html = fs.readFileSync(htmlPath, 'utf8');

  // Find css file in assets
  const assetsDir = path.join(targetDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    const cssFile = files.find(f => f.endsWith('.css'));
    if (cssFile) {
      const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');
      
      // Inject inline style before </head> if not already injected
      if (!html.includes('id="hk-inlined-styles"')) {
        const styleTag = `\n    <style id="hk-inlined-styles">\n${cssContent}\n    </style>\n  </head>`;
        html = html.replace('</head>', styleTag);
      }

      // Ensure fallback link has no crossorigin and works on relative and absolute
      const regexLink = new RegExp(`<link[^>]*href="[^"]*${cssFile}"[^>]*>`, 'g');
      html = html.replace(regexLink, `<link rel="stylesheet" href="./assets/${cssFile}"><link rel="stylesheet" href="/assets/${cssFile}">`);
    }
  }

  // Ensure script tags have fallback without crossorigin issues
  html = html.replace(/<link rel="stylesheet" crossorigin /g, '<link rel="stylesheet" ');

  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`[post-build] Successfully inlined CSS & optimized HTML in ${targetDir}`);
}

processHtml(distDir);

// Sync to htdocs
if (fs.existsSync(htdocsDir)) {
  fs.rmSync(htdocsDir, { recursive: true, force: true });
}
fs.cpSync(distDir, htdocsDir, { recursive: true });

// Remove node server outputs from htdocs
const filesToRemove = ['server.cjs', 'server.cjs.map'];
for (const f of filesToRemove) {
  const p = path.join(htdocsDir, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

// Re-generate zip
import('child_process').then(({ execSync }) => {
  try {
    execSync('python3 -c "import shutil; shutil.make_archive(\'htdocs_ready\', \'zip\', \'htdocs\')"', { stdio: 'inherit' });
    console.log('[post-build] Generated htdocs_ready.zip successfully');
  } catch (err) {
    console.error('[post-build] Failed to generate zip', err);
  }
});
