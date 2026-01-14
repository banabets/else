ELSE Terminal

Minimal autonomous observer that posts to X.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:

```env
# Groq API (free tier - ultra-fast, up to 800 tokens/sec)
# Get API key at https://console.groq.com/keys
GROQ_API_KEY=your_groq_api_key_here

# Twitter/X API credentials
X_API_KEY=your_api_key
X_API_KEY_SECRET=your_api_key_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_SECRET=your_access_secret
```

3. Build and run:
```bash
npm run build
npm start
```

## Getting API Keys

### Groq API Key

1. Go to https://console.groq.com and create a free account
2. Go to https://console.groq.com/keys
3. Create a new API key
4. Copy the key to your `.env` file

### Twitter/X API Keys

Para obtener las 4 claves necesarias de X (Twitter):

1. **Crear cuenta de desarrollador:**
   - Ve a https://developer.twitter.com/
   - Inicia sesión con tu cuenta de X
   - Si es tu primera vez, deberás solicitar acceso como desarrollador
   - Completa el formulario explicando que quieres crear un bot que publica tweets

2. **Crear un proyecto y aplicación:**
   - Una vez aprobado, ve a https://developer.twitter.com/en/portal/dashboard
   - Haz clic en "Create Project" o "Create App"
   - Completa la información:
     - **Project name**: Ej: "ELSE Terminal Bot"
     - **Use case**: Selecciona "Making a bot"
     - **App name**: Ej: "else-terminal"

3. **Obtener las claves:**
   - Después de crear la app, ve a la pestaña **"Keys and Tokens"**
   - Ahí encontrarás:
     - **API Key** → Esta es tu `X_API_KEY`
     - **API Key Secret** → Esta es tu `X_API_KEY_SECRET`
     - Haz clic en "Generate" en la sección **"Access Token and Secret"**
     - **Access Token** → Esta es tu `X_ACCESS_TOKEN`
     - **Access Token Secret** → Esta es tu `X_ACCESS_SECRET`

4. **Configurar permisos (MUY IMPORTANTE):**
   - En la pestaña **"Settings"** de tu app
   - Ve a **"User authentication settings"**
   - Habilita **"Read and write"** permissions (NO solo "Read")
   - Guarda los cambios
   - **⚠️ IMPORTANTE**: Después de cambiar los permisos, DEBES regenerar los Access Tokens:
     - Ve de vuelta a **"Keys and Tokens"**
     - Haz clic en **"Regenerate"** en la sección "Access Token and Secret"
     - Copia los NUEVOS tokens (los antiguos ya no funcionarán)

5. **Copiar al `.env`:**
   - Copia cada valor a tu archivo `.env`
   - **IMPORTANTE**: Nunca compartas estas claves ni las subas a GitHub

### ⚠️ Error 403: Permisos incorrectos

Si ves el error `403: Your client app is not configured with the appropriate oauth1 app permissions`:

1. **En X Developer Portal:**
   - Ve a https://developer.twitter.com/en/portal/dashboard
   - Selecciona tu app → pestaña **"Settings"**
   - En **"User authentication settings"** cambia a **"Read and write"**
   - Guarda los cambios
   - Ve a **"Keys and Tokens"** → **"Regenerate"** los Access Tokens
   - Copia los NUEVOS tokens

2. **Actualizar en Railway:**
   - Ve a tu proyecto en https://railway.app
   - Selecciona tu servicio
   - Ve a la pestaña **"Variables"**
   - Actualiza estas variables con los nuevos valores:
     - `X_ACCESS_TOKEN` → nuevo token
     - `X_ACCESS_SECRET` → nuevo secret
   - Railway reiniciará automáticamente el servicio

3. **Verificar:**
   - Espera a que Railway termine de desplegar
   - Revisa los logs para confirmar que funciona

## Why Groq?

- **Ultra-fast**: Up to 800 tokens/second (much faster than Hugging Face)
- **Free tier**: Generous free limits
- **Better quality**: Uses Llama 3.1 models (better than Mistral for thinking/writing)
- **Reliable**: More stable than Hugging Face Inference API
- **OpenAI-compatible**: Same API format as OpenAI, easy to switch later if needed
