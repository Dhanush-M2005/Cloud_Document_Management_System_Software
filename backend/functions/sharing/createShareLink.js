const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { logAction } = require('../../utils/audit');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' }));
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

const { getUserIdFromEvent, requireRole } = require('../../utils/auth');
const generateToken = () => crypto.randomBytes(16).toString('hex');

module.exports.handler = async (event) => {
    try {
        const documentId = event.pathParameters.id;
        const body = JSON.parse(event.body || "{}");
        const { permission = 'VIEW', expirationMinutes = 10080, accessLevel = 'PUBLIC' } = body;

        await requireRole(event, ['EDITOR', 'ADMIN']);
        const ownerId = await getUserIdFromEvent(event);

        const docRes = await docClient.send(new GetCommand({ TableName: process.env.DOCUMENTS_TABLE, Key: { documentId } }));
        if (!docRes.Item || docRes.Item.ownerId !== ownerId) return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "FORBIDDEN", data: null, message: "Forbidden" }) };

        const shareToken = generateToken();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(expirationMinutes, 10));

        await docClient.send(new PutCommand({
            TableName: process.env.SHARE_LINKS_TABLE,
            Item: {
                shareToken,
                documentId,
                ownerId,
                recipientUserId: accessLevel,
                accessLevel,
                permission,
                createdAt: new Date().toISOString(),
                expiresAt: expiresAt.toISOString(),
                status: 'ACTIVE'
            }
        }));

        await logAction(ownerId, 'SHARE_CREATED', documentId, 'SUCCESS');

        return { statusCode: 201, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, code: "SHARE_CREATED", data: { shareToken, url: `/share/${shareToken}` }, message: "Private share link generated" }) };
    } catch (error) {
        if (error.message && error.message.startsWith("Unauthorized") || error.name === "JwtVerificationError") return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "UNAUTHORIZED", data: null, message: "Invalid or missing token" }) };
        if (error.message && error.message.startsWith("Forbidden")) return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "FORBIDDEN", data: null, message: "Forbidden" }) };
        return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "INTERNAL_ERROR", data: null, message: error.message }) };
    }
};
