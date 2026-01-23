FROM ubuntu:24.04

# Installer Python 3 et dépendances système + LLVM 19
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-venv python3-pip \
    clang-19 libclang-19-dev \
    build-essential git unzip curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Créer un venv Python
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Installer les packages Python
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir clang==19.1.7

# Copier le code source
COPY src/ ./src

# Cloner Exploit-DB dans src/
RUN git clone --depth=1 https://gitlab.com/exploit-database/exploitdb.git ./src/exploitdb


EXPOSE 8000

# Lancer le serveur
CMD ["uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "8000"]


# docker build -t cpp-analyzer-backend .
# docker tag cpp-analyzer-backend europe-west1-docker.pkg.dev/ansyd-lab/docker-backend/cpp-analyzer-backend:latest
# docker push europe-west1-docker.pkg.dev/ansyd-lab/docker-backend/cpp-analyzer-backend:latest

# gcloud run deploy cpp-analyzer-backend --image europe-west1-docker.pkg.dev/ansyd-lab/docker-backend/cpp-analyzer-backend:latest --region europe-west1 --platform managed --allow-unauthenticated --port 8000 --set-env-vars OPENROUTER_API_KEY="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"