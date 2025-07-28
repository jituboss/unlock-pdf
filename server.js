const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.post('/unlock', upload.single('pdf'), (req, res) => {
  const password = req.body.password;
  const originalName = req.file.originalname;
  const baseName = path.parse(originalName).name;
  const outputName = `${baseName}_Unlocked.pdf`;

  const inputPath = req.file.path;
  const outputPath = path.join('uploads', outputName);

  const command = `qpdf --password='${password}' --decrypt "${inputPath}" "${outputPath}"`;

  exec(command, (err) => {
    if (err) {
      console.error('Failed to unlock PDF:', err);
      return res.status(500).send('Failed to unlock PDF. Wrong password?');
    }

    res.download(outputPath, outputName, (err) => {
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
