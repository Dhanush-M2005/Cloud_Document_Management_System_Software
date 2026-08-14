const { getUserIdFromEvent, requireRole } = require('../../utils/auth');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' }));

module.exports.handler = async (event) => {
    try {
        await requireRole(event, ['VIEWER', 'EDITOR', 'ADMIN']);
        const ownerId = await getUserIdFromEvent(event);

        const res = await docClient.send(new ScanCommand({
            TableName: process.env.SHARE_LINKS_TABLE,
            FilterExpression: "ownerId = :uid",
            ExpressionAttributeValues: {
                ":uid": ownerId
            }
        }));

        const now = new Date();
        const activeShares = (res.Items || []).filter(s => s.status === 'ACTIVE' && new Date(s.expiresAt) > now);

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: true, code: "OWNED_SHARES_RETRIEVED", data: activeShares, message: "Active share metrics retrieved" })
        };
    } catch (error) {
        if (error.message && error.message.startsWith("Unauthorized") || error.name === "JwtVerificationError") return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "UNAUTHORIZED", data: null, message: "Invalid or missing token" }) };
        if (error.message && error.message.startsWith("Forbidden")) return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "FORBIDDEN", data: null, message: "Forbidden" }) };
        console.error(error);
        return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "INTERNAL_ERROR", data: null, message: "Error retrieving shares" }) };
    }
};
