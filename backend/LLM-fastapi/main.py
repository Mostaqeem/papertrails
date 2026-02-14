from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama


app = FastAPI()


# Configure CORS to allow requests from your React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
                "http://localhost:5173",
                "http://172.17.231.72:3000",
                "http://localhost:3000",      # React dev server
                "http://127.0.0.1:3000",      # React dev server (alternative)
                "http://localhost:5173",      # Vite dev server
                "http://frontend:80",         # Nginx in Docker
                "http://localhost:80", ],  # React app URL. This should be changed in deployment.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Define a request model
class PromptRequest(BaseModel):
    prompt: str

@app.post("/generate")
async def generate(request: PromptRequest):
    try: 
        # response = ollama.chat(model="qwen3:0.6b", messages=[{"role": "user", "content": prompt}])
        response = ollama.generate(model="llama3.2:1b", prompt=request.prompt)
        return {"result": response["response"]}
    except Exception as e:
        return {"error": str(e)}



# Optional health check endpoint. This will be used to verify whrether the service is running or not.

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "LLM-service"}
