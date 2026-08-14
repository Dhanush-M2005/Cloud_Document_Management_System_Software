const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const logAction = async (userId, action, documentId, status = 'SUCCESS') => {
    try {
        await docClient.send(new PutCommand({
            TableName: process.env.AUDIT_LOGS_TABLE,
            Item: {
                auditId: randomUUID(),
                userId,
                action,
                documentId,
                timestamp: new Date().toISOString(),
                status
            }
        }));
        console.log(`Audited action: ${action} for doc: ${documentId}`);
    } catch (error) {
        // We log the error but don't strictly throw (to not interrupt main user flows)
        console.error("Failed to write audit log:", error);
    }
};

module.exports = { logAction };
