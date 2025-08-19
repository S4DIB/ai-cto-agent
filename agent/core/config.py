import os
from dotenv import load_dotenv

# Load environment variables from config.env
load_dotenv("config.env")

class Settings:
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))

settings = Settings()