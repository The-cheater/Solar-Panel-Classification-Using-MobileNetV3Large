# Read the doc: https://huggingface.co/docs/hub/spaces-sdks-docker
FROM python:3.10-slim

# Hugging Face Spaces requires running as a non-root user
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY --chown=user ./backend/requirements.txt /app/backend/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --upgrade -r /app/backend/requirements.txt

# Copy the rest of the application using the current directory structure
COPY --chown=user . /app/

# Hugging Face Spaces sets PORT to 7860 by default
EXPOSE 7860

# Run uvicorn on port 7860
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
