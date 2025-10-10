const { BlobServiceClient } = require("@azure/storage-blob");

// Funktion zum Generieren eines Bildes
// https://developer.ideogram.ai/api-reference/api-reference/generate
exports.generateImage = async (prompt) => {
  try {
    const apiKey = process.env.IDEOGRAM_API_KEY;
    const url = "https://api.ideogram.ai/generate";

    const options = {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_request: {
          prompt: prompt,
          style_type: "REALISTIC",
          aspect_ratio: process.env.IDEOGRAM_RECIPE_ASPECT,
          model: process.env.IDEOGRAM_MODEL,
          magic_prompt_option: "OFF", // AUTO ON OFF
        },
      }),
    };

    const response = await fetch(url, options);
    const data = await response.json();
    if (data.data[0] && data.data[0].url) {
      return data.data[0].url;
    } else {
      throw new Error("Failed to generate image");
    }
  } catch (error) {
    console.error("Error generating image:", error.message);
    return false;
  }
};

// Funktion zum Hochladen eines Bildes in Azure Blob Storage

exports.uploadImageToStorage = async (imageUrl, filename) => {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);

    const blobName = `${filename}.jpg`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Bild von der URL abrufen
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Bild in Blob Storage hochladen
    await blockBlobClient.upload(buffer, buffer.length);

    return blockBlobClient.url;
  } catch (error) {
    console.error("Error uploading image:", error.message);
    return false;
  }
};

// Funktion zum Löschen eines Bildes aus Azure Blob Storage
exports.deleteImageFromStorage = async (imageUrl) => {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);

    const blobName = imageUrl.split("/").pop(); // Blob-Name aus der URL extrahieren
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.delete();

    return true;
  } catch (error) {
    console.error("Error deleting image:", error.message);
    return false;
  }
};

// Upload a base64 encoded image directly to Azure Blob Storage
exports.uploadBase64ImageToStorage = async (imageBase64, filename) => {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);

    const blobName = `${filename}.png`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const buffer = Buffer.from(imageBase64, 'base64');
    await blockBlobClient.upload(buffer, buffer.length);

    return blockBlobClient.url;
  } catch (error) {
    console.error('Error uploading base64 image:', error.message);
    return false;
  }
};
