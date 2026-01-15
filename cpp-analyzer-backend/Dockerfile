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
