import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // cb(null, `${Date.now()}-${file.originalname}`);
        cb(null, file.originalname);
    }
})

export const upload = multer({ storage: storage }).array('files')
export const uploadOne = multer({ storage: storage }).single('file')