const { getUserIdFromEvent, requireRole } = require('../../utils/auth');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' }));

module.exports.handler = async (event) => {
    try {
        const shareToken = event.pathParameters.shareId;
        await requireRole(event, ['EDITOR', 'ADMIN']);
        const ownerId = await getUserIdFromEvent(event);

        const shareRes = await docClient.send(new GetCommand({ TableName: process.env.SHARE_LINKS_TABLE, Key: { shareToken } }));
        if (!shareRes.Item || shareRes.Item.ownerId !== ownerId) return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "FORBIDDEN", data: null, message: "Forbidden" }) };

        await docClient.send(new UpdateCommand({
            TableName: process.env.SHARE_LINKS_TABLE,
            Key: { shareToken },
            UpdateExpression: "set #status = :revoked",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: { ":revoked": "REVOKED" }
        }));

        return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, code: "SHARE_REVOKED", data: null, message: "Link revoked successfully" }) };
    } catch (error) {
        if (error.message && error.message.startsWith("Unauthorized") || error.name === "JwtVerificationError") return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "UNAUTHORIZED", data: null, message: "Invalid or missing token" }) };
        if (error.message && error.message.startsWith("Forbidden")) return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "FORBIDDEN", data: null, message: "Forbidden" }) };
        return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "INTERNAL_ERROR", data: null, message: "Error revoking link" }) };
    }
};
