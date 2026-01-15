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

# Hugging Face API (free - for image generation)
# Get token at https://huggingface.co/settings/tokens
HUGGING_FACE_API_KEY=your_hugging_face_token_here

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

### Hugging Face API Key (for image generation)

1. Go to https://huggingface.co and create a free account
2. Go to https://huggingface.co/settings/tokens
3. Create a new token (read access is enough)
4. Copy the token to your `.env` file

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
   
   **Ubicación exacta para cambiar permisos:**
   
   1. Ve a https://developer.twitter.com/en/portal/dashboard
   2. En el menú lateral izquierdo, haz clic en **"Projects & Apps"**
   3. Selecciona tu proyecto (o haz clic en "Overview" si ya estás en el proyecto)
   4. En la sección **"Standalone Apps"**, haz clic en el nombre de tu app
   5. En la página de tu app, busca la sección **"App settings"**
   6. Busca **"User authentication settings"** y haz clic en **"Set Up"** (o "Edit" si ya está configurado)
   7. En la configuración, completa:
      - **App type**: **"Automated App"** o **"Bot"** (NO "Web App" ni "Native App")
      - **App permissions**: **"Read and write"** (NO solo "Read")
      - **Type of App**: **"OAuth 1.0a"** (si te pregunta)
      - **Callback URI / Redirect URL**: 
        - Para un bot automatizado, puedes usar: `https://localhost` o `https://127.0.0.1`
        - O la URL de tu repositorio: `https://github.com/tu-usuario/else-terminal`
        - O la URL de Railway si tienes dominio: `https://tu-app.railway.app`
        - **Nota**: Este campo puede ser opcional para bots automatizados
      - **Website URL**:
        - Puedes usar: `https://github.com/tu-usuario/else-terminal`
        - O la URL de Railway si tienes dominio: `https://tu-app.railway.app`
        - O simplemente: `https://localhost`
   8. Haz clic en **"Save"** para guardar los cambios
   
   **⚠️ CRÍTICO - Regenerar tokens después de cambiar permisos:**
   
   Después de cambiar los permisos, los tokens antiguos dejan de funcionar. DEBES regenerarlos:
   
   1. Ve a la pestaña **"Keys and tokens"** (en el menú superior de tu app)
   2. En la sección **"Access Token and Secret"**, haz clic en **"Regenerate"**
   3. Confirma la regeneración
   4. Copia los NUEVOS tokens (los antiguos ya no funcionarán)

5. **Copiar al `.env`:**
   - Copia cada valor a tu archivo `.env`
   - **IMPORTANTE**: Nunca compartas estas claves ni las subas a GitHub

### ⚠️ Error 403: Permisos incorrectos

Si ves el error `403: Your client app is not configured with the appropriate oauth1 app permissions`:

1. **En X Developer Portal:**
   
   **Paso a paso detallado:**
   
   - Ve a https://developer.twitter.com/en/portal/dashboard
   - Menú lateral: **"Projects & Apps"** → selecciona tu proyecto
   - En **"Standalone Apps"**, haz clic en el nombre de tu app
   - En **"App settings"**, busca **"User authentication settings"**
   - Haz clic en **"Set Up"** o **"Edit"**
   - En la configuración, completa:
     - **App type**: **"Automated App"** o **"Bot"** (NO "Web App" ni "Native App")
     - **App permissions**: **"Read and write"** (cambia de "Read" a "Read and write")
     - **Type of App**: **"OAuth 1.0a"** (si te pregunta)
     - **Callback URI / Redirect URL**: 
       - Puedes usar: `https://localhost` o `https://127.0.0.1`
       - O tu URL de GitHub: `https://github.com/tu-usuario/else-terminal`
     - **Website URL**: 
       - Puedes usar: `https://github.com/tu-usuario/else-terminal`
       - O simplemente: `https://localhost`
   - Haz clic en **"Save"**
   - Ve a la pestaña **"Keys and tokens"** (menú superior)
   - En **"Access Token and Secret"**, haz clic en **"Regenerate"**
   - Copia los NUEVOS tokens (los antiguos ya no funcionan)

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

### ✅ Checklist de Verificación (si el error 403 persiste):

**Verifica cada paso en X Developer Portal:**

1. ✅ **Permisos configurados:**
   - Ve a tu app → **"App settings"** → **"User authentication settings"**
   - Verifica que diga: **"Read and write"** (NO solo "Read")
   - Si dice solo "Read", cámbialo a "Read and write" y guarda

2. ✅ **Tokens regenerados DESPUÉS de cambiar permisos:**
   - Ve a **"Keys and tokens"** → **"Access Token and Secret"**
   - Verifica que hayas hecho clic en **"Regenerate"** DESPUÉS de cambiar los permisos
   - Los tokens antiguos NO funcionan después de cambiar permisos
   - Copia los tokens NUEVOS (no los antiguos)

3. ✅ **Variables actualizadas en Railway:**
   - Ve a Railway → tu servicio → **"Variables"**
   - Verifica que `X_ACCESS_TOKEN` tenga el token NUEVO (regenerado)
   - Verifica que `X_ACCESS_SECRET` tenga el secret NUEVO (regenerado)
   - Si usaste tokens antiguos, actualízalos con los nuevos

4. ✅ **Reinicio del servicio:**
   - Railway debería reiniciarse automáticamente al actualizar variables
   - Si no, haz clic en **"Redeploy"** o reinicia manualmente

**Si después de todo esto sigue el error 403:**
- Asegúrate de que el **App type** sea **"Automated App"** o **"Bot"** (no "Web App")
- Espera 5-10 minutos después de cambiar permisos (puede haber un delay)
- Verifica que guardaste los cambios en "User authentication settings"

## Why Groq?

- **Ultra-fast**: Up to 800 tokens/second (much faster than Hugging Face)
- **Free tier**: Generous free limits
- **Better quality**: Uses Llama 3.1 models (better than Mistral for thinking/writing)
- **Reliable**: More stable than Hugging Face Inference API
- **OpenAI-compatible**: Same API format as OpenAI, easy to switch later if needed
