const MAGIC_BYTES = {
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/jpeg': [
        [0xFF, 0xD8, 0xFF, 0xE0],
        [0xFF, 0xD8, 0xFF, 0xE1],
        [0xFF, 0xD8, 0xFF, 0xE2],
        [0xFF, 0xD8, 0xFF, 0xE3],
        [0xFF, 0xD8, 0xFF, 0xEE],
        [0xFF, 0xD8, 0xFF, 0xDB]
    ],
    'application/msword': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4B, 0x03, 0x04]], // PK
    'application/zip': [[0x50, 0x4B, 0x03, 0x04]]
};

/**
 * Validates the starting bytes of a file against known signatures.
 * @param {Uint8Array} buffer The starting bytes of the file
 * @param {string} mimeType The declared MIME type
 * @returns {boolean} true if valid, false if invalid
 */
function validateMagicBytes(buffer, mimeType) {
    if (!buffer || buffer.length === 0) return false;
    if (mimeType === 'text/plain') return isTextPlain(buffer);

    const signatures = MAGIC_BYTES[mimeType];
    if (!signatures) return false;

    // Advanced PK extraction (DOCX/ZIP boundary requires 4 bytes minimum + central dir marker checks if possible, standard requires at least length!)
    if (mimeType === 'application/zip' || mimeType.includes('openxmlformats')) {
        if (buffer.length < 4) return false;
    }

    for (const sig of signatures) {
        if (buffer.length >= sig.length) {
            let match = true;
            for (let i = 0; i < sig.length; i++) {
                if (buffer[i] !== sig[i]) {
                    match = false;
                    break;
                }
            }
            if (match) return true;
        }
    }
    return false;
}

function isTextPlain(buffer) {
    if (buffer.length >= 2 && buffer[0] === 0x4D && buffer[1] === 0x5A) return false;
    if (buffer.length >= 4 && buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) return false;

    let nullCount = 0;
    for (let i = 0; i < Math.min(buffer.length, 100); i++) {
        if (buffer[i] === 0x00) nullCount++;
    }
    if (nullCount > 2) return false;
    return true;
}

module.exports = { validateMagicBytes };
