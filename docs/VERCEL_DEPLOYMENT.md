# 🚀 Vercel Deployment Guide - QuickCart Backend

## ✅ **CORS Configurado para Testing**

Tu backend ahora acepta requests desde **cualquier origen** en desarrollo, perfecto para pruebas locales.

## 🎯 **Pasos para Deploy en Vercel**

### **1. Preparar el código**

```bash
# Asegúrate de estar en el directorio del proyecto
cd quickcart-ecom-backend

# Commit todos los cambios
git add .
git commit -m "feat: configure for Vercel deployment with flexible CORS"
git push origin main
```

### **2. Deploy en Vercel**

1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu GitHub y selecciona `quickcart-ecom-backend`
3. Vercel detectará automáticamente la configuración

### **3. Configurar Variables de Entorno**

En Vercel Dashboard > Project Settings > Environment Variables:

```
NODE_ENV=production
DATABASE_URL=tu_url_completa_de_supabase
JWT_SECRET=tu-secreto-jwt-super-seguro-de-32-caracteres
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=*
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=1000
ADMIN_EMAIL=admin@quickcart.com
ADMIN_PASSWORD=Admin123!
```

### **4. Testing Local con CORS Flexible**

```bash
# Inicia tu backend local
npm run start:dev

# Desde cualquier origen (React, Postman, curl):
curl http://localhost:3000/api/v1/products

# Otros endpoints de prueba:
curl http://localhost:3000/api/v1/products/categories
curl http://localhost:3000/api/v1/products/featured
```

## 🌐 **URLs después del Deploy**

- **API Base**: `https://tu-proyecto.vercel.app`
- **Products**: `https://tu-proyecto.vercel.app/api/v1/products`
- **Health**: `https://tu-proyecto.vercel.app/api/v1`
- **Docs**: `https://tu-proyecto.vercel.app/api/docs` (solo en dev)

## 🧪 **Testing desde Frontend**

```javascript
// En tu React app
const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://tu-proyecto.vercel.app/api/v1'
    : 'http://localhost:3000/api/v1';

// Fetch desde cualquier puerto local
fetch(`${API_BASE_URL}/products`)
  .then((res) => res.json())
  .then((data) => console.log(data));
```

## 🔧 **CORS Configuración Actual**

- ✅ **Desarrollo**: Acepta TODOS los orígenes
- ✅ **Producción**: Acepta localhost, Vercel, Netlify + configurados
- ✅ **Sin credenciales**: Funciona desde Postman/curl
- ✅ **Con credenciales**: Funciona desde browsers

## ⚡ **Optimizaciones para Vercel**

1. **Cold Start**: Primer request puede tardar 2-5 segundos
2. **Timeout**: Máximo 30 segundos por request (configurado)
3. **Memory**: Optimizado para serverless functions
4. **Database**: Usa connection pooling con Supabase

## 🚨 **Troubleshooting**

### **Si tienes errores de CORS:**

```bash
# Verifica que CORS_ORIGIN esté configurado
echo $CORS_ORIGIN  # Debe ser * o incluir tu dominio
```

### **Si Vercel build falla:**

```bash
# Verifica que el build funcione localmente
npm run build
npm run start:prod
```

### **Si database connection falla:**

```bash
# Verifica la DATABASE_URL de Supabase
echo $DATABASE_URL  # Debe empezar con postgresql://
```

---

🎯 **¿Listo para hacer el deploy?** Solo sigue los pasos y tendrás tu API funcionando en Vercel en menos de 10 minutos!
