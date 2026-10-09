const { requireRole } = require('../../utils/auth');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
    try {
        const { role } = await requireRole(event, ['VIEWER', 'EDITOR', 'ADMIN']);

        const params = {
            TableName: process.env.DOCUMENTS_TABLE,
            FilterExpression: '#status = :statusVal',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { ':statusVal': 'ACTIVE' }
        };

        const data = await docClient.send(new ScanCommand(params));
        let userDocs = data.Items || [];

        if (role === 'VIEWER') {
            userDocs = userDocs.filter(d => !d.visibility || d.visibility === 'ALL');
        } else if (role === 'EDITOR') {
            userDocs = userDocs.filter(d => !d.visibility || d.visibility === 'ALL' || d.visibility === 'EDITOR_ADMIN');
        }

        return {
            statusCode: 200,
            headers: { 
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            },
            body: JSON.stringify({ success: true, code: "DOCUMENTS_LISTED", data: userDocs, message: "Documents retrieved successfully" })
        };
    } catch (error) {
        if (error.message && error.message.startsWith("Unauthorized") || error.name === "JwtVerificationError") return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "UNAUTHORIZED", data: null, message: "Invalid or missing token" }) };
        console.error("Error listing documents:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: false, code: "INTERNAL_ERROR", data: null, message: "Internal server error" })
        };
    }
};
