"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPropertyPhotos = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Create uploads directory if it doesn't exist
const uploadsDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Configure multer for memory storage (we'll convert to base64)
const storage = multer_1.default.memoryStorage();
// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.'), false);
    }
};
// Multer upload configuration
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});
// Upload property photos
const uploadPropertyPhotos = async (req, res) => {
    try {
        if (!req.files || !Array.isArray(req.files)) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        const photos = [];
        // Convert each file to base64
        for (const file of req.files) {
            const base64String = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            photos.push(base64String);
        }
        res.json({
            success: true,
            photos,
            message: `${photos.length} photo(s) uploaded successfully`,
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload photos' });
    }
};
exports.uploadPropertyPhotos = uploadPropertyPhotos;
//# sourceMappingURL=uploadController.js.map