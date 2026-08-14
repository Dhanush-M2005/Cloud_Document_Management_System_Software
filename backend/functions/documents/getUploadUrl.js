const { getUserIdFromEvent, requireRole } = require('../../utils/auth');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { randomUUID } = require('crypto');

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

module.exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body || "{}");
        const { fileName, fileType, fileSize } = body;

        if (!fileName || !fileType || !fileSize) {
            return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "MISSING_FIELDS", data: null, message: "fileName, fileType, and fileSize are required" }) };
        }

        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (!allowedTypes.includes(fileType)) {
            return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "INVALID_MIME_TYPE", data: null, message: "Unsupported file type. Allowed: PDF, JPG, PNG, DOC/DOCX." }) };
        }

        if (fileSize > 50 * 1024 * 1024) {
            return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "PAYLOAD_TOO_LARGE", data: null, message: "Payload exceeds 50MB secure hard limit." }) };
        }

        // Strict RBAC boundary: Only editors can natively upload generic payloads.
        await requireRole(event, ['EDITOR', 'ADMIN']);
        const userId = await getUserIdFromEvent(event);

        const documentId = randomUUID();
        const s3Key = `documents/${userId}/${documentId}/${fileName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: s3Key,
            ContentType: fileType,
            Tagging: "status=pending"
        });

        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: true, code: "UPLOAD_URL_GENERATED", data: { uploadUrl, documentId, s3Key }, message: "Ready to upload" })
        };
    } catch (error) {
        if (error.message && error.message.startsWith("Unauthorized") || error.name === "JwtVerificationError") return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "UNAUTHORIZED", data: null, message: "Invalid or missing token" }) };
        if (error.message && error.message.startsWith("Forbidden")) return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "FORBIDDEN", data: null, message: "Forbidden" }) };
        console.error("Error generating upload URL", error);
        return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "INTERNAL_ERROR", data: null, message: "Internal server error" }) };
    }
};
