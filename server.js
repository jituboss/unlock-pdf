const express = require('express');
const multer = require('multer');
const { execFile } = require('child_process');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const PORT = Number(process.env.PORT) || 3000;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.disable('x-powered-by');

const randomPdfName = () => `${crypto.randomBytes(16).toString('hex')}.pdf`;

const upload = multer({
  // Random name with a .pdf extension: Ubuntu's AppArmor profile for qpdf
  // only lets it open files ending in .pdf/.json/.qdf.
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, randomPdfName()),
  }),
  limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 5, fieldSize: 1024 },
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      path.extname(file.originalname).toLowerCase() === '.pdf';
    cb(null, isPdf);
  },
});

app.use(express.static(path.join(__dirname, 'public')));

const removeQuietly = (p) => fs.rm(p, { force: true }, () => {});

// Make the user-supplied name safe for use as a download filename only.
const safeBaseName = (name) =>
  path
    .parse(path.basename(name || 'document.pdf'))
    .name.replace(/[^\w.\- ()]/g, '_')
    .slice(0, 200) || 'document';

app.post('/unlock', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Please upload a PDF file.');
  }

  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const baseName = safeBaseName(req.file.originalname);
  const downloadName = password === '' ? `${baseName}.pdf` : `${baseName}_Unlocked.pdf`;

  const inputPath = req.file.path;
  // Server-generated output name: never derived from user input.
  const outputPath = path.join(UPLOAD_DIR, randomPdfName());

  // execFile (no shell) so the password and paths can't inject commands.
  execFile(
    'qpdf',
    [`--password=${password}`, '--decrypt', '--', inputPath, outputPath],
    { timeout: 30_000 },
    (err, stdout, stderr) => {
      // qpdf exit code 3 = succeeded with warnings.
      if (err && err.code !== 3) {
        // Don't log err itself: it contains the command line, including the password.
        // qpdf's stderr names files and the problem, never the password.
        console.error('Failed to unlock PDF (qpdf exit code %s): %s', err.code, String(stderr).trim());
        removeQuietly(inputPath);
        removeQuietly(outputPath);
        return res.status(422).send('Failed to unlock PDF. Wrong password?');
      }

      res.download(outputPath, downloadName, () => {
        removeQuietly(inputPath);
        removeQuietly(outputPath);
      });
    }
  );
});

// Multer / generic error handler: no stack traces to clients.
app.use((err, req, res, next) => {
  if (req.file) removeQuietly(req.file.path);
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 50 MB).' : 'Invalid upload.';
    return res.status(400).send(msg);
  }
  console.error('Unexpected error:', err.message);
  res.status(500).send('Internal server error.');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
