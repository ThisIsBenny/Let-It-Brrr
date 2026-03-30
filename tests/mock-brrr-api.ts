const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  
  // Log incoming requests
  console.log(`${req.method} ${url.pathname}`);
  
  if (req.method === "POST" && url.pathname.startsWith("/v1/")) {
    const body = await req.json();
    console.log("Body:", JSON.stringify(body, null, 2));
    
    // Mock successful response
    return new Response(JSON.stringify({
      success: true,
      id: "mock-notification-id"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" }
  });
};

Deno.serve({ port: 8001 }, handler);