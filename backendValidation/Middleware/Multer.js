import multer from 'multer';
import path from 'path';


const requiredTypes=['application/zip',
  'text/csv',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain'];

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + file.originalname;
    cb(null, name);
  }
  });

function isValidFileType(req, file, cb) {
  if(requiredTypes.includes(file.mimetype)){
    cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }

const upload = multer({ storage,isValidFileType, limits: { fileSize: 10 * 1024 * 1024 } });
export default upload;
