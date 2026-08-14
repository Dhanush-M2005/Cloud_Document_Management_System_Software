const { getUserIdFromEvent } = require('../../utils/auth');
const { S3Client, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { logAction } = require('../../utils/audit');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const REGION = process.env.AWS_REGION || 'ap-south-1';
const s3 = new S3Client({ region: REGION });
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

module.exports.handler = async (event) => {
    try {
        const documentId = event.pathParameters.id;
        const ownerId = await getUserIdFromEvent(event);

        // 1. Verify ownership
        const getRes = await docClient.send(new GetCommand({
            TableName: process.env.DOCUMENTS_TABLE,
            Key: { documentId }
        }));

        const doc = getRes.Item;
        if (!doc || (doc.ownerId !== ownerId && doc.accessType === "PRIVATE")) {
            return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "FORBIDDEN", data: null, message: "Forbidden" }) };
        }

        // 2. Generate secure temp download URL
        try {
            await s3.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: doc.s3Key }));
        } catch (s3err) {
            console.error("Missing S3 Object:", doc.s3Key);
            return { statusCode: 404, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "OBJECT_MISSING", data: null, message: "File missing from secure vault." }) };
        }

        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: doc.s3Key,
        });
        const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

        await logAction(ownerId, 'DOWNLOAD', documentId, 'SUCCESS');

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: true, code: "DOWNLOAD_URL_GENERATED", data: { downloadUrl, debug_s3Key: doc.s3Key }, message: "Ready" })
        };
    } catch (error) {
        if (error.message && error.message.startsWith("Unauthorized") || error.name === "JwtVerificationError") return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "UNAUTHORIZED", data: null, message: "Invalid or missing token" }) };
        console.error(error);
        return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "INTERNAL_ERROR", data: null, message: "Error generating download link" }) };
    }
};
