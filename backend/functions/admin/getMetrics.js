const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { requireRole } = require('../../utils/auth');

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' }));

module.exports.handler = async (event) => {
    try {
        await requireRole(event, ['ADMIN']);

        // Total documents & storage aggressively dynamically updated based on the ACTUAL items in the database table
        const docs = await docClient.send(new ScanCommand({ TableName: process.env.DOCUMENTS_TABLE }));
        const totalDocuments = docs.Items ? docs.Items.length : 0;
        const totalStorageBytes = docs.Items ? docs.Items.reduce((acc, doc) => acc + (doc.fileSize || 0), 0) : 0;
        const totalStorageMB = (totalStorageBytes / 1024 / 1024).toFixed(2);

        // Get audit counts
        const logs = await docClient.send(new ScanCommand({ TableName: process.env.AUDIT_LOGS_TABLE }));
        const totalEvents = logs.Items ? logs.Items.length : 0;

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: true, code: "METRICS_RETRIEVED", data: { totalDocuments, totalStorageMB, totalEvents }, message: "Metrics loaded" })
        };
    } catch (error) {
        if (error.message && error.message.startsWith("Unauthorized") || error.name === "JwtVerificationError") return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "UNAUTHORIZED", data: null, message: "Invalid or missing token" }) };
        if (error.message && error.message.startsWith("Forbidden")) return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "FORBIDDEN", data: null, message: "Admin access required" }) };
        return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "INTERNAL_ERROR", data: null, message: "Error fetching metrics" }) };
    }
};
