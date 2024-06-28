import os
import base64
import json

from modal import (
    Image,
    Stub,
    build,
    enter,
    gpu,
    method,
    asgi_app,
    Function,
    functions
)
from fastapi import  FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import time

sdxl_image = (
    Image.debian_slim(python_version="3.10")
    .apt_install("git", "ffmpeg")
    .pip_install("packaging")  # Install packaging first
    .pip_install(
        "transformers",
        "ninja",
        "wheel",
        "torch",
        "hf-transfer~=0.1",
        "ffmpeg-python",
        "accelerate",
    )
)
stub = Stub("transcript_generator")

with sdxl_image.imports():
    import torch
    from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline

web_app = FastAPI()
web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = '/model'

@stub.cls(gpu=gpu.A10G(), container_idle_timeout=240, image=sdxl_image)
class Model:
    @build()
    def build(self):
        from huggingface_hub import snapshot_download
        snapshot_download("openai/whisper-large-v3", local_dir=MODEL_DIR)

    @enter()
    def enter(self):
        self.device = "cuda:0" if torch.cuda.is_available() else "cpu"
        self.torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

        model = AutoModelForSpeechSeq2Seq.from_pretrained(
            MODEL_DIR, 
            torch_dtype=self.torch_dtype,
            use_safetensors=True,
            low_cpu_mem_usage=True,
            use_flash_attention_2=False,  # Disable flash attention
        )
        processor = AutoProcessor.from_pretrained(MODEL_DIR)

        model.to(self.device)
        self.pipe = pipeline(
            "automatic-speech-recognition",
            model=model,
            tokenizer=processor.tokenizer,
            feature_extractor=processor.feature_extractor,
            max_new_tokens=128,
            chunk_length_s=30,
            batch_size=16,
            return_timestamps=True,
            torch_dtype=self.torch_dtype,
            device=self.device,
        )

    def _inference(self, audio: bytes):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as fp:
            fp.write(audio)
            fp_name = fp.name

        start = time.time()
        output = self.pipe(
            fp_name,
            chunk_length_s=30,
            batch_size=16,
            return_timestamps=True
        )
        elapsed = time.time() - start

        os.unlink(fp_name)  # Clean up the temporary file
        return output, elapsed

    @method()
    def inference(self, audio: bytes):
        output, elapsed = self._inference(audio)
        
        # Create a JSON-friendly version of the output
        json_output = {
            "text": output["text"],
            "chunks": [
                {
                    "text": chunk["text"],
                    "timestamp": [chunk["timestamp"][0], chunk["timestamp"][1]]
                }
                for chunk in output["chunks"]
            ]
        }
        
        return {
            "transcription": output,
            "json_output": json_output,
            "elapsed_time": elapsed
        }
@web_app.post("/transcribe")
async def transcribe(request: Request):
    data = await request.json()
    audio_base64 = data['audio']
    filename = data['filename']
    print(filename)
    # Decode base64 audio
    audio_bytes = base64.b64decode(audio_base64)
    
    # Save to temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as fp:
        fp.write(audio_bytes)
        fp_name = fp.name
    
    f = Function.lookup("transcript_generator", "Model.inference")
    call = f.spawn(audio_bytes)
    
    # Clean up temporary file
    os.unlink(fp_name)
    
    return {"call_id": call.object_id}

@web_app.get("/stats")
def stats():
    f = Function.lookup("transcript_generator", "Model.inference")
    return f.get_current_stats()

@web_app.post("/call_id")
async def get_completion(request: Request):
    form = await request.form()
    call_id = form["call_id"]
    f = functions.FunctionCall.from_id(call_id)
    try:
        result = f.get(timeout=0)
        return JSONResponse(content=result)
    except TimeoutError:
        return JSONResponse(content="Processing", status_code=202)

@stub.function(allow_concurrent_inputs=4)
@asgi_app()
def entrypoint():
    return web_app

@stub.local_entrypoint()
def main(audio_path: str):
    with open(audio_path, "rb") as audio_file:
        audio_bytes = audio_file.read()
    print(f"Read {len(audio_bytes)} bytes from {audio_path}")
    model = Model()
    result = model.inference.remote(audio_bytes)
    print(f"Transcription: {result['transcription']}")
    print(f"JSON Output: {json.dumps(result['json_output'], indent=2)}")
    print(f"Elapsed time: {result['elapsed_time']} seconds")

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python script.py <path_to_audio_file>")
        sys.exit(1)
    main(sys.argv[1])