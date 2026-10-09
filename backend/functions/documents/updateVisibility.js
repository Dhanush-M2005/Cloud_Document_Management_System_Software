const { getUserIdFromEvent, requireRole } = require('../../utils/auth');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { logAction } = require('../../utils/audit');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' }));

module.exports.handler = async (event) => {
    try {
        const documentId = event.pathParameters.id;
        const body = JSON.parse(event.body || "{}");
        const { visibility } = body;
        
        if (!['ALL', 'EDITOR_ADMIN', 'ADMIN_ONLY'].includes(visibility)) {
            return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "BAD_REQUEST", message: "Invalid visibility level" }) };
        }

        // Strictly enforce ADMIN role for visibility mutations
        await requireRole(event, ['ADMIN']);
        const adminId = await getUserIdFromEvent(event);

        const getRes = await docClient.send(new GetCommand({ TableName: process.env.DOCUMENTS_TABLE, Key: { documentId } }));
        if (!getRes.Item) return { statusCode: 404, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "NOT_FOUND", data: null, message: "Document not found" }) };

        await docClient.send(new UpdateCommand({
            TableName: process.env.DOCUMENTS_TABLE,
            Key: { documentId },
            UpdateExpression: "set visibility = :v, updatedAt = :t",
            ExpressionAttributeValues: { ":v": visibility, ":t": new Date().toISOString() }
        }));

        await logAction(adminId, 'UPDATE_VISIBILITY', documentId, 'SUCCESS');

        return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, code: "VISIBILITY_UPDATED", data: { visibility }, message: "Access level modified securely" }) };
    } catch (error) {
        if (error.message && error.message.startsWith("Unauthorized") || error.name === "JwtVerificationError") return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "UNAUTHORIZED", data: null, message: "Invalid or missing token" }) };
        if (error.message && error.message.startsWith("Forbidden")) return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "FORBIDDEN", data: null, message: "Forbidden" }) };
        return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "INTERNAL_ERROR", data: null, message: "Error updating document visibility" }) };
    }
};
