const { getUserIdFromEvent, requireRole } = require('../../utils/auth');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { logAction } = require('../../utils/audit');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, DeleteCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' }));

module.exports.handler = async (event) => {
    try {
        const documentId = event.pathParameters.id;
        await requireRole(event, ['EDITOR', 'ADMIN']);
        const ownerId = await getUserIdFromEvent(event);

        const getRes = await docClient.send(new GetCommand({ TableName: process.env.DOCUMENTS_TABLE, Key: { documentId } }));
        const doc = getRes.Item;
        if (!doc || doc.ownerId !== ownerId) return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "FORBIDDEN", data: null, message: "Forbidden" }) };

        // 1. Delete from S3
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: doc.s3Key }));

        // 2. Delete from DynamoDB
        await docClient.send(new DeleteCommand({ TableName: process.env.DOCUMENTS_TABLE, Key: { documentId } }));

        // 3. Sweep and Terminate Active Share Links dynamically
        const shareData = await docClient.send(new ScanCommand({ TableName: process.env.SHARE_LINKS_TABLE }));
        const activeShares = shareData.Items.filter(s => s.documentId === documentId && s.status === 'ACTIVE');
        for (const s of activeShares) {
            await docClient.send(new UpdateCommand({
                TableName: process.env.SHARE_LINKS_TABLE,
                Key: { shareToken: s.shareToken },
                UpdateExpression: "set #status = :revoked",
                ExpressionAttributeNames: { "#status": "status" },
                ExpressionAttributeValues: { ":revoked": "REVOKED_CASCADING" }
            }));
        }

        await logAction(ownerId, 'DELETE', documentId, 'SUCCESS');

        return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, code: "DOCUMENT_DELETED", data: null, message: "Document deleted successfully" }) };
    } catch (error) {
        if (error.message && error.message.startsWith("Unauthorized") || error.name === "JwtVerificationError") return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "UNAUTHORIZED", data: null, message: "Invalid or missing token" }) };
        if (error.message && error.message.startsWith("Forbidden")) return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "FORBIDDEN", data: null, message: "Forbidden" }) };
        return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "INTERNAL_ERROR", data: null, message: "Error deleting document" }) };
    }
};
