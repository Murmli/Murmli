const streams = {};

exports.addClient = (listId, res) => {
  if (!streams[listId]) {
    streams[listId] = new Set();
  }
  streams[listId].add(res);
};

exports.removeClient = (listId, res) => {
  if (streams[listId]) {
    streams[listId].delete(res);
    if (streams[listId].size === 0) {
      delete streams[listId];
    }
  }
};

exports.broadcast = (listId, data) => {
  const clients = streams[listId];
  if (!clients) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
};
