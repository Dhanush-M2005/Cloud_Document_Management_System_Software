const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
// Import robustly relative to serverless compilation
const { logAction } = require('../../utils/audit');

const sns = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

module.exports.handler = async (event) => {
    console.log("Received EventBridge upload event:", JSON.stringify(event, null, 2));

    try {
        const s3Details = event.detail;
        if (!s3Details || !s3Details.object) {
            console.log("Not an S3 object event, skipping.");
            return;
        }

        const s3Key = s3Details.object.key;
        // Standard Key structure: documents/{userId}/{documentId}/{fileName}
        const parts = decodeURIComponent(s3Key).split('/');
        if (parts.length < 4 || parts[0] !== 'documents') {
            console.log("Unrecognized S3 key structure, skipping audit logging:", s3Key);
            return;
        }

        const userId = parts[1];
        const documentId = parts[2];
        const fileName = parts.slice(3).join('/');

        // 1. Write the background Audit Log 
        await logAction(userId, 'UPLOAD', documentId, 'SUCCESS');

        // 2. Trigger SNS Notification
        // Mock user email until tied natively with Cognito attributes
        const message = `Success! Your file "${fileName}" was successfully uploaded and securely stored in CDMS.\n\nTime: ${event.time}\nDocument ID: ${documentId}`;

        await sns.send(new PublishCommand({
            TopicArn: process.env.SNS_TOPIC_ARN,
            Subject: 'CDMS: Document Upload Successful',
            Message: message,
        }));

        console.log("Upload was successfully audited and notified.");
    } catch (error) {
        console.error("Error processing asynchronous S3 upload event:", error);
    }
};
