import os

MODEL_DIR = '/model'
MAX_AUDIO_SIZE = 10 * 1024 * 1024  # 10 MB
HUGGINGFACE_MODEL = "openai/whisper-large-v3"
TEMP_DIR = os.environ.get('TEMP_DIR', '/tmp')