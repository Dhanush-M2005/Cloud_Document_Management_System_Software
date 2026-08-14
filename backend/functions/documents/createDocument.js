const { getUserIdFromEvent, requireRole } = require('../../utils/auth');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectTaggingCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { logAction } = require('../../utils/audit');
const { validateMagicBytes } = require('../../utils/fileValidator');

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body || "{}");
        const { documentId, fileName, fileType, fileSize } = body;

        if (!documentId || !fileName || !fileSize) {
            return {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ success: false, code: "MISSING_FIELDS", data: null, message: "Missing required document fields" })
            };
        }

        // Standard RBAC verification. 
        await requireRole(event, ['EDITOR', 'ADMIN']);
        const ownerId = await getUserIdFromEvent(event);
        const ownerName = "Authenticated User";
        const s3KeyEnforced = `documents/${ownerId}/${documentId}/${fileName}`;

        // MAGIC BYTE VALIDATION LAYER
        try {
            const headObj = await s3.send(new GetObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: s3KeyEnforced,
                Range: "bytes=0-255"
            }));
            const chunks = [];
            for await (const chunk of headObj.Body) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);

            if (!validateMagicBytes(buffer, fileType)) {
                await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: s3KeyEnforced }));
                await logAction(ownerId, 'SECURITY_BLOCK', documentId, 'FILE_SPOOF_DETECTED');
                return {
                    statusCode: 400,
                    headers: { "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify({ success: false, code: "MALICIOUS_FILE", data: null, message: "File spoofing detected. Upload destroyed." })
                };
            }
        } catch (err) {
            if (err.name === 'NoSuchKey' || err.name === 'AccessDenied') {
                return {
                    statusCode: 404,
                    headers: { "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify({ success: false, code: "UPLOAD_NOT_FOUND", data: null, message: "S3 object not found for confirmation" })
                };
            }
            throw err;
        }

        const params = {
            TableName: process.env.DOCUMENTS_TABLE,
            Item: {
                documentId,
                ownerId,
                ownerName,
                fileName,
                originalFileName: fileName,
                fileType,
                fileSize,
                s3Key: s3KeyEnforced,
                uploadedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: "ACTIVE",
                accessType: "PRIVATE"
            }
        };

        await docClient.send(new PutCommand(params));

        await s3.send(new PutObjectTaggingCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: s3KeyEnforced,
            Tagging: { TagSet: [{ Key: "status", Value: "confirmed" }] }
        }));

        await logAction(ownerId, 'UPLOAD_COMPLETE', documentId, 'SUCCESS');

        return {
            statusCode: 201,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: true, code: "DOCUMENT_CREATED", data: { documentId }, message: "Document saved securely" })
        };
    } catch (error) {
        if (error.message && error.message.startsWith("Unauthorized") || error.name === "JwtVerificationError") return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "UNAUTHORIZED", data: null, message: "Invalid or missing token" }) };
        console.error("Error creating document record:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: false, code: "INTERNAL_ERROR", data: null, message: "Internal server error: " + error.message + " | " + error.stack })
        };
    }
};
