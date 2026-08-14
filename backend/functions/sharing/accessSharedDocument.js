const { S3Client, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { logAction } = require('../../utils/audit');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { getUserIdFromEvent, requireRole } = require('../../utils/auth');

const REGION = process.env.AWS_REGION || 'ap-south-1';
const s3 = new S3Client({ region: REGION });
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

module.exports.handler = async (event) => {
    try {
        const shareToken = event.pathParameters.token;

        const shareRes = await docClient.send(new GetCommand({
            TableName: process.env.SHARE_LINKS_TABLE,
            Key: { shareToken }
        }));
        const share = shareRes.Item;
        if (!share || share.status !== 'ACTIVE') return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "LINK_INVALID", data: null, message: "Link is invalid or has been manually revoked." }) };

        let callerId = "ANONYMOUS";

        // Dynamic Gate: Internal strictly mandates user tokens without targeting explicit subs.
        if (share.accessLevel === 'INTERNAL') {
            const authData = await requireRole(event, ['VIEWER', 'EDITOR', 'ADMIN']);
            callerId = authData.id;
        }

        if (new Date(share.expiresAt) < new Date()) return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "LINK_EXPIRED", data: null, message: "Link has safely expired." }) };

        const docRes = await docClient.send(new GetCommand({ TableName: process.env.DOCUMENTS_TABLE, Key: { documentId: share.documentId } }));
        const doc = docRes.Item;
        if (!doc) return { statusCode: 404, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "DOCUMENT_NOT_FOUND", data: null, message: "Document no longer exists." }) };

        try {
            await s3.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: doc.s3Key }));
        } catch (s3error) {
            console.error("S3 Integrity Error - Object Missing:", doc.s3Key);
            return { statusCode: 404, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "OBJECT_MISSING", data: null, message: "Corrupted share: document missing from secure vault." }) };
        }

        const command = new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: doc.s3Key });
        const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

        await logAction(callerId, 'SHARE_ACCESSED', share.documentId, 'SUCCESS');

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({
                success: true,
                code: "SHARE_ACCESSED",
                data: { fileName: doc.fileName, fileType: doc.fileType, fileSize: doc.fileSize, ownerId: share.ownerId, permission: share.permission, expiresAt: share.expiresAt, downloadUrl },
                message: "Secure token validated"
            })
        };
    } catch (error) {
        if (error.message && error.message.startsWith("Unauthorized") || error.name === "JwtVerificationError") return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "UNAUTHORIZED", data: null, message: "Invalid or missing token" }) };
        if (error.message && error.message.startsWith("Forbidden")) return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "FORBIDDEN", data: null, message: error.message }) };
        return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "INTERNAL_ERROR", data: null, message: "Error safely accessing document link" }) };
    }
};
