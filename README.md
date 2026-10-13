# Sistema de Taller del Roble Colombiano
- Estado: Despliegue en producción verificado (Octubre 2026).

## Mejoras futuras

- **Entrega de correos transaccionales (pendiente):** el motor unificado de
  verificación 2FA está completo —código de 6 dígitos con hash SHA-256 en BD,
  expiración de 5 minutos, 5 intentos, bloqueo, reenvío cada 60 segundos y
  enlaces de recuperación de un solo uso—, pero la entrega real por correo
  está pendiente porque el entorno de despliegue (Railway) bloquea el SMTP
  saliente (Errno 101: Network is unreachable). El canal ya está implementado
  (`CanalCorreoBrevo`, API HTTPS por el puerto 443) y se activa definiendo la
  variable de entorno `BREVO_API_KEY`; la alternativa es solicitar al
  proveedor el desbloqueo del SMTP saliente. Mientras tanto, la aplicación
  corre con `DEBUG=True` y muestra el código de verificación (y el enlace de
  recuperación) en pantalla —modo demostración— para que la navegación
  completa siga siendo posible. Al activar el canal real: poner
  `DEBUG=False` en Railway (los campos `codigo_demo`/`enlace_demo` dejan de
  viajar automáticamente).