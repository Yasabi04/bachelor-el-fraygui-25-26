exports.handler = async (event) => {
  console.log("CONNECT EVENT:", JSON.stringify(event));

  const connectionId = event.requestContext.connectionId;
  console.log("New connection:", connectionId);

  return {
    statusCode: 200,
  };
};