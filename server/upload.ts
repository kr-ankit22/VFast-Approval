import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/documents';
    // Ensure the directory exists
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const bookingId = (req as any).params.bookingId;
    const ext = path.extname(file.originalname);
    const filename = `${bookingId}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    console.log('Uploaded file mimetype:', file.mimetype);
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || ext === '.zip') {
      cb(null, true);
    } else {
      cb(new Error('Only .zip files are allowed!'));
    }
  },
});

export default upload;
