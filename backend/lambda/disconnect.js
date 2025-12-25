exports.handler = async (event) => {
  console.log("DISCONNECT EVENT:", JSON.stringify(event));

  const connectionId = event.requestContext.connectionId;
  console.log("Remove connection:", connectionId);
  console.log('Goodbye!')

  return {
    statusCode: 200,
  };
};