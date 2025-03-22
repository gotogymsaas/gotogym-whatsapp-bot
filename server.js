require('dotenv').config();
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY);

const express = require('express');
const twilio = require('twilio');
const axios = require('axios');
const schedule = require('node-schedule');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Ruta de prueba para GET
app.get('/', (req, res) => {
  res.send("Servidor funcionando");
});

// Cargar credenciales desde .env
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const openaiApiKey = process.env.OPENAI_API_KEY;

const client = twilio(accountSid, authToken);

// Mensaje de contexto reforzado para el asistente de ventas premium.
// Usa EXACTAMENTE la siguiente información sin inventar enlaces ni detalles adicionales.
const contextMessage = `
Bienvenido a la experiencia exclusiva de "GoToGym By John Frank Alza". Al ingresar a nuestra boutique, usted es recibido con la elegancia y distinción que caracterizan nuestro servicio premium, encabezado por la inigualable Conchita Buendia. Chat Porfavor DEBES responder de forma clara y precisa utilizando EXACTAMENTE la siguiente información, sin inventar enlaces ni detalles adicionales.
Por favor chat comienza con esta pregunta.
🔹 Diferenciación de Roles de Usuario:
   - Pregunta: ¿Ha adquirido ya su prenda o prefiere conocer más detalles sobre nuestra exclusiva colección?
     1️⃣ Sí, ya adquirí mi prenda y deseo personalizarla.
     2️⃣ No, deseo conocer más detalles antes de mi compra.

📌 Si el usuario responde 2️⃣:
   - Se le invita a descubrir la colección, su exclusividad, beneficios y opciones de pago.
Por favor chat, ayudalo a descubrir cual es su mejor opción de prendas entres basica premium, semi personalizada y totalmente personalizada. Con esta informacion identificada compartele el link de pago que corresponda al gusto de nuestro cliente. 

   - Opciones de Pago (Ingles):
       • Básica Premium: $45 USD, link: https://www.paypal.com/ncp/payment/3428Y4HSQ9PPA
       • Semi Personalizado: $78 USD, link: https://www.paypal.com/ncp/payment/82M9Q7DTYQM66
•Totalmente Personalizado: $180 USD, link: https://www.paypal.com/ncp/payment/PXHE4VFGAFYYU
   - Opciones de Pago (Español):
       • Básica Premium: 175 Mil COP, link: https://mpago.li/2cBebL9
       • Semi Personalizado: 300 Mil COP, link: https://mpago.li/2utKSBt
       • Totalmente Personalizado: 687.500 COP, link: https://mpago.li/1yp8C8n
   - Además:
Nosotros tenemos este https://biolibre.co/gotogym que contienen las tres formas de pago para la situacion cuando el cliente no sabe cual escoger aca puede escoger cualquiera de las tres prendas para opción de pago. 

Preguntas Frecuentes: 
Este formulario esta elaborado para cuando las personas han realizado el pago y no han llenado el formulario de creyentes, El proceso de compra cuenta con tres etapas. La primera etapa es el pago, luego llenar el formulario de creyentes, esta en ingles y español para cada tipo de cliente. 
 Formularios Creyentes: Inglés: https://tinyurl.com/2xh5sgk6, 
Formulario español Español: https://tinyurl.com/2988l77x
Cuando nuestros clientes quieran preguntar acerca de quienes somos y donde nos pueden encontrar, puedes compartir cualquiera de estas redes sociales que genere mas empatia con el cliente. Le puedes preguntar cual le gusta mas. 
 • Redes Sociales:
 - Facebook: https://www.facebook.com/Gotogym.Sportwear
 - Twitter: https://twitter.com/GOTOGYM6
 - LinkedIn: https://www.linkedin.com/company/33262154/
 - Instagram: https://www.instagram.com/gotogym.sportwear
 - Pinterest: https://co.pinterest.com/gotogym_/
 - YouTube: https://www.youtube.com/channel/UCXRp8PgcE7L75jEewIixeXg
 - Angelist: https://angel.co/go-to-gym
 - Crunchbase: https://www.crunchbase.com/organization/go-to-gym
 - Soundcloud: https://soundcloud.com/go-to-gym-sportswear-as-a-service
 - TikTok: https://www.tiktok.com/@gotogym.sportwear

Tenemos una estrategia de Donaciones, este link es para aquellos clientes que realmente sean creyentes de GoToGym y que busquen apoyarnos en nuestra misión, en es te link podemos recibir las dondaciones que nos quieren enviar, estamos muy agradecidos con ellos. gracias. 
 • Donaciones y Más:
 - Donaciones Paypal: https://paypal.me/gotogym?country.x=CO&locale.x=es_XC
 
Este es el linktree de GoToGym By John Frank Alza, contiende nuestra Landing Page, los tres botones de pagos y el formulario en español. 
Linktree: https://linktr.ee/GTGBYJFA
 - Landing Page: https://gotogymbyjohnfrankalza.mailchimpsites.com/

📌 Si el usuario responde 1️⃣:
   - Se activa el proceso de personalización, solicitando: Talla, Color preferido, Modelo IA favorito y Bebida de preferencia.
   1. Se proporciona el formulario de personalización: https://forms.gle/3ZYgrDjChmVeWka98
   2. Se invita a agendar una cita exclusiva con John Frank Alza: https://calendly.com/gotogymbyjohnfrankalza/60min

📌 Estrategia de Contacto Post Venta:
   - Se programa un mensaje de seguimiento 1 minuto después de la respuesta inicial, expresando agradecimiento y resaltando la experiencia premium.
Y le compartimos nuestro Juego Virtual Creyentes The luxury Quest https://gotogymsaas.github.io/creyentes-luxury-quest/
Este jugo virtal hace parte de nuestra estrategia de marketing y funciona como fidelización de clientes

Instrucción Final (muy estricta): Responde ÚNICAMENTE utilizando la información proporcionada en este mensaje de contexto. NO inventes, modifiques ni agregues ningún dato, enlace, red social o detalle que no esté expresamente incluido aquí. Si el dato solicitado no aparece, responde "Información no disponible".
Por favor responde en el Idioma que te hablen.

// Sistema de detección de abuso: palabras clave prohibidas y contador de intentos fuera de contexto
const palabrasClaveNoPermitidas = ["chiste", "meme", "nada", "probando", "aliens", "fútbol", "política", "otro tema"];
let intentosNoValidos = 0;

function analizarMensaje(usuarioMensaje) {
  const mensajeLimpio = usuarioMensaje.toLowerCase();
  if (palabrasClaveNoPermitidas.some(palabra => mensajeLimpio.includes(palabra))) {
    intentosNoValidos++;
    if (intentosNoValidos >= 3) {
      return "Parece que esta conversación no está relacionada con GoToGym. Si necesitas información real, estaré aquí. De lo contrario, finalizaré la conversación.";
    } else {
      return "Estoy aquí para ayudarte con la colección exclusiva GoToGym By John Frank Alza. ¿Cómo puedo asistirte?";
    }
  }
  if (intentosNoValidos >= 10) {
    return "Hemos intercambiado varios mensajes sin un propósito claro. Si deseas conocer más sobre GoToGym en el futuro, estaré encantado de ayudarte. ¡Hasta pronto!";
  }
  return "¿Cómo puedo asistirte hoy con GoToGym?";
}

// Función auxiliar para esperar (en milisegundos)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.post('/whatsapp', async (req, res) => {
  console.log("Webhook recibido:", req.body);
  // Responde inmediatamente a Twilio para evitar reintentos
  res.sendStatus(200);

  const messageBody = req.body.Body;
  const sender = req.body.From;
  console.log(`Mensaje de ${sender}: ${messageBody}`);

  // Asegurarse de que el número incluya el "+"
  const formattedSender = sender.replace("whatsapp: ", "whatsapp:+");

  // Verificar si el mensaje contiene contenido no relacionado
  const respuestaAnalisis = analizarMensaje(messageBody);
  if (respuestaAnalisis !== "¿Cómo puedo asistirte hoy con GoToGym?") {
    try {
      await client.messages.create({
        from: `whatsapp:${whatsappNumber}`,
        to: formattedSender,
        body: respuestaAnalisis,
      });
      console.log("Mensaje de no abuso enviado.");
    } catch (err) {
      console.error("Error enviando mensaje de no abuso:", err);
    }
    return;
  }

  let retryCount = 0;
  const maxRetries = 5;
  let delay = 2000; // 2 segundos iniciales

  while (retryCount < maxRetries) {
    try {
      console.log("Enviando mensaje a OpenAI...");
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: contextMessage },
            { role: 'user', content: messageBody }
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const chatGptResponse = response.data.choices[0].message.content;
      console.log("Respuesta de ChatGPT:", chatGptResponse);

      console.log("Enviando respuesta a Twilio...");
      const twilioResponse = await client.messages.create({
        from: `whatsapp:${whatsappNumber}`,
        to: formattedSender,
        body: chatGptResponse,
      });
      console.log("Mensaje enviado con SID:", twilioResponse.sid);

      // Programar un mensaje de seguimiento post venta 1 minuto después
      schedule.scheduleJob(new Date(Date.now() + 60000), async () => {
        try {
          const followUpMessage = "¡Muchas gracias por tu interés en GoToGym By John Frank Alza! Apreciamos tu confianza y esperamos que disfrutes de nuestra experiencia premium. Si tienes alguna duda adicional, estamos aquí para ayudarte.";
          const followUpResponse = await client.messages.create({
            from: `whatsapp:${whatsappNumber}`,
            to: formattedSender,
            body: followUpMessage,
          });
          console.log("Mensaje de seguimiento enviado con SID:", followUpResponse.sid);
        } catch (err) {
          console.error("Error enviando mensaje de seguimiento:", err);
        }
      });

      break;
    } catch (error) {
      // Si se excede el límite de mensajes diarios, detener los reintentos.
      if (error.response && error.response.data && error.response.data.code === 63038) {
        console.error("Límite diario de mensajes excedido. Deteniendo reintentos.", error.response.data);
        break;
      }
      if (error.response && error.response.status === 429) {
        retryCount++;
        console.error(`Rate limit alcanzado. Reintento ${retryCount} de ${maxRetries} en ${delay} ms`, error.response.data);
        await sleep(delay);
        delay *= 2;
      } else {
        console.error("Error en el bot:", error);
        break;
      }
    }
  }

  if (retryCount === maxRetries) {
    console.error("Se alcanzó el número máximo de reintentos para la solicitud a OpenAI.");
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Bot de WhatsApp con Twilio y ChatGPT está corriendo en el puerto ${PORT}`);
});

