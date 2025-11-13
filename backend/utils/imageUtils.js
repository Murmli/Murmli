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
const DATA_URL_REGEX = /^data:(?<mime>[^;]+);base64,(?<data>.+)$/i;

const resolveAspectRatio = () => {
  const requestedRatio = process.env.RECIPE_IMAGE_ASPECT_RATIO || "3:2";
  return SUPPORTED_ASPECT_RATIOS.has(requestedRatio) ? requestedRatio : "3:2";
};

const getContainerClient = () => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

  if (!connectionString || !containerName) {
    throw new Error("Missing Azure storage configuration");
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  return blobServiceClient.getContainerClient(containerName);
};

const uploadBufferToBlob = async (buffer, filename, extension = "jpg") => {
  const containerClient = getContainerClient();
  const sanitizedExtension = extension || "jpg";
  const blobName = `${filename}.${sanitizedExtension}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.upload(buffer, buffer.length);
  return blockBlobClient.url;
};

const parseDataUrl = (dataUrl) => {
  const match = typeof dataUrl === "string" ? DATA_URL_REGEX.exec(dataUrl) : null;
  if (!match || !match.groups?.data) {
    throw new Error("Invalid data URL format");
  }
  return {
    mimeType: match.groups.mime,
    base64: match.groups.data,
  };
};

const mimeTypeToExtension = (mimeType = "") => {
  if (typeof mimeType !== "string" || !mimeType.includes("/")) {
    return "png";
  }
  const [, subtype] = mimeType.split("/");
  if (!subtype) {
    return "png";
  }
  return subtype.split("+")[0];
};

const normalizeImageUrl = (entry) => {
  if (!entry) {
    return null;
  }
  if (typeof entry === "string") {
    return entry;
  }
  if (typeof entry.url === "string") {
    return entry.url;
  }
  if (entry.image_url) {
    return normalizeImageUrl(entry.image_url);
  }
  if (entry.content) {
    return normalizeImageUrl(entry.content);
  }
  return null;
};

const extractImageUrlFromMessage = (message) => {
  if (!message) {
    return null;
  }

  if (Array.isArray(message.images)) {
    for (const imageItem of message.images) {
      const url = normalizeImageUrl(imageItem);
      if (url) {
        return url;
      }
    }
  }

  if (Array.isArray(message.content)) {
    const contentEntry = message.content.find((contentItem) => contentItem?.type === "output_image");
    const url =
      normalizeImageUrl(contentEntry) ||
      normalizeImageUrl(contentEntry?.image_url) ||
      normalizeImageUrl(contentEntry?.image_url?.url);
    if (url) {
      return url;
    }
  }

  return normalizeImageUrl(message.image_url);
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
    const imageUrl = extractImageUrlFromMessage(message);

    if (!imageUrl) {
      throw new Error("OpenRouter response did not include an image payload");
    }

    return imageUrl;
  } catch (error) {
    console.error("Error generating image:", error.message);
    return false;
  }
};

// Funktion zum Hochladen eines Bildes in Azure Blob Storage

exports.uploadImageToStorage = async (imageSource, filename) => {
  try {
    let buffer;
    let extension = "jpg";

    if (typeof imageSource === "string" && imageSource.startsWith("data:")) {
      const { mimeType, base64 } = parseDataUrl(imageSource);
      buffer = Buffer.from(base64, "base64");
      extension = mimeTypeToExtension(mimeType);
    } else {
      const response = await fetch(imageSource);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    return await uploadBufferToBlob(buffer, filename, extension);
  } catch (error) {
    console.error("Error uploading image:", error.message);
    return false;
  }
};

// Funktion zum Löschen eines Bildes aus Azure Blob Storage
exports.deleteImageFromStorage = async (imageUrl) => {
  try {
    const containerClient = getContainerClient();
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
exports.uploadBase64ImageToStorage = async (imageBase64, filename, mimeType = "image/png") => {
  try {
    const buffer = Buffer.from(imageBase64, "base64");
    const extension = mimeTypeToExtension(mimeType);
    return await uploadBufferToBlob(buffer, filename, extension);
  } catch (error) {
    console.error("Error uploading base64 image:", error.message);
    return false;
  }
};
