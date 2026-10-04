# Server

Express owns HTTP contracts and domain behavior. Keep route handlers thin,
validate request data at this boundary, and access storage through repository
interfaces rather than importing persistence into client code.
