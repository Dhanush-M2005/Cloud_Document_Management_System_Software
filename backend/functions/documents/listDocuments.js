const { getUserIdFromEvent } = require('../../utils/auth');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
    try {
        const ownerId = await getUserIdFromEvent(event);

        const params = {
            TableName: process.env.DOCUMENTS_TABLE,
        };

        const data = await docClient.send(new ScanCommand(params));
        const userDocs = data.Items.filter(item => item.ownerId === ownerId);

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
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
