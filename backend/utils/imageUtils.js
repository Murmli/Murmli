const { BlobServiceClient } = require("@azure/storage-blob");

const OPENROUTER_IMAGE_MODEL = process.env.OPENROUTER_RECIPE_IMAGE_MODEL || "google/gemini-2.5-flash-image";
const SUPPORTED_ASPECT_RATIOS = new Set([
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "9:16",
  "16:9",
  "21:9",
]);

const resolveAspectRatio = () => {
  const requestedRatio = process.env.RECIPE_IMAGE_ASPECT_RATIO || "3:2";
  return SUPPORTED_ASPECT_RATIOS.has(requestedRatio) ? requestedRatio : "3:2";
};

// Funktion zum Generieren eines Bildes über OpenRouter (Gemini 2.5 Flash Image)
exports.generateImage = async (prompt) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_IMAGE_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
        image_config: {
          aspect_ratio: resolveAspectRatio(),
        },
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      throw new Error(`OpenRouter image generation failed: ${response.status} ${response.statusText} - ${errorPayload}`);
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message;
    const outputImageEntry = Array.isArray(message?.content)
      ? message.content.find((contentItem) => contentItem?.type === "output_image")
      : null;
    const imageUrl = outputImageEntry?.image_url?.url || outputImageEntry?.image_url;

    if (!imageUrl) {
      throw new Error("OpenRouter response did not include an image URL");
    }

    return imageUrl;
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
