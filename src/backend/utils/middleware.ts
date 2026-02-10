import { config } from "@/lib/config"

export function errorHandler(error: Error, req: Request) {
  console.error('Server error:', error)

  if (!config.development) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  return Response.json(
    {
      error: error.message,
      stack: error.stack,
    },
    { status: 500 }
  )
}
