export default async function healthCheck(): Promise<Response> {
  return Response.json({ status: "ok" });
}
