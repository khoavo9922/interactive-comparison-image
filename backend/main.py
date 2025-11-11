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
async def process_image(
    prompt: str = Form(...), 
    file: UploadFile = File(...),
    mask: UploadFile = File(None)
):
    try:
        # Read image file contents
        contents = await file.read()

        # Open the image with Pillow to process it
        with Image.open(io.BytesIO(contents)) as image:
            # Convert to RGBA if needed (DALL-E 2 edit API requires RGBA, LA, or L format)
            if image.mode not in ['RGBA', 'LA', 'L']:
                image = image.convert('RGBA')
            
            # Resize the image to be 1024x1024 (required square size for DALL-E 2 edit API)
            resized_image = image.resize((1024, 1024))

            # Convert the image to PNG format in an in-memory buffer
            png_buffer = io.BytesIO()
            resized_image.save(png_buffer, format='PNG')
            png_buffer.seek(0)
            png_buffer.name = 'image.png'

            # Process mask if provided
            mask_buffer = None
            if mask:
                mask_contents = await mask.read()
                with Image.open(io.BytesIO(mask_contents)) as mask_image:
                    # Convert mask to RGBA
                    if mask_image.mode != 'RGBA':
                        mask_image = mask_image.convert('RGBA')
                    
                    # Resize mask to match image size
                    resized_mask = mask_image.resize((1024, 1024))
                    
                    # Save mask to buffer
                    mask_buffer = io.BytesIO()
                    resized_mask.save(mask_buffer, format='PNG')
                    mask_buffer.seek(0)
                    mask_buffer.name = 'mask.png'

            # Call OpenAI DALL-E 2 for image editing
            # Improve the prompt for better object removal
            enhanced_prompt = f"A photo with the following changes: {prompt}. Fill in the removed areas naturally to match the surrounding environment."
            
            if mask_buffer:
                response = client.images.edit(
                    model="dall-e-2",
                    image=png_buffer,
                    mask=mask_buffer,
                    prompt=enhanced_prompt,
                    n=1,
                    size="1024x1024"
                )
            else:
                response = client.images.edit(
                    model="dall-e-2",
                    image=png_buffer,
                    prompt=enhanced_prompt,
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
        # Be more specific about the error if possible
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {e}")
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch the edited image from OpenAI's URL: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during image processing: {e}")
