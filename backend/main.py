from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse
from PIL import Image
import io
import os
import openai
import requests
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise ValueError("OPENAI_API_KEY environment variable not set")

client = openai.OpenAI()

@app.post("/api/process-image")
async def process_image(prompt: str = Form(...), file: UploadFile = File(...)):
    try:
        # Read image file into bytes
        contents = await file.read()
        image_bytes = io.BytesIO(contents)
        image_bytes.seek(0)

        # Call OpenAI DALL-E 2 for image editing
        response = client.images.edit(
            model="dall-e-2",
            image=contents,
            prompt=prompt,
            n=1,
            size="1024x1024"
        )

        # Get the URL of the edited image
        image_url = response.data[0].url

        # Fetch the image from the URL
        image_response = requests.get(image_url)
        image_response.raise_for_status()  # Raise an exception for bad status codes

        # Return the edited image as a streaming response
        return StreamingResponse(io.BytesIO(image_response.content), media_type="image/png")

    except openai.APIError as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {e}")
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch image from URL: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")
