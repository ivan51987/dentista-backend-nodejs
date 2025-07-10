const AWS = require('aws-sdk');
const AppError = require('./appError');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

exports.uploadToS3 = async (file, key, contentType) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'private'
    };

    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    throw new AppError('Error uploading file to S3', 500);
  }
};

exports.deleteFromS3 = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(params).promise();
  } catch (error) {
    throw new AppError('Error deleting file from S3', 500);
  }
};