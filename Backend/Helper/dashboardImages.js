const fs = require('fs');
const { cloudinary } = require('./imageUpload');

const uploadDashboardImages = async (files) => {
  const urls = [];

  for (const file of files) {
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(base64, {
      folder: 'trekking_images',
    });
    urls.push(result.secure_url);
  }

  return urls;
};

module.exports = uploadDashboardImages;
