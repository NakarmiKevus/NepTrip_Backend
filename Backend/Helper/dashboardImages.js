const fs = require('fs');
const { cloudinary } = require('./imageUpload');

const uploadDashboardImages = async (files) => {
  const urls = [];

  for (const file of files) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'trekking_images'
    });
    urls.push(result.secure_url);
    fs.unlinkSync(file.path); // delete local temp file
  }

  return urls;
};

module.exports = uploadDashboardImages;
