# Roles de usuarios

El registro público asigna siempre `user` (Usuario), aunque la petición incluya otro rol. Las cuentas existentes también reciben `user` al aplicar la migración. Los roles disponibles son `user` y `admin` (Administrador).

Las bases de datos locales y sus respaldos están excluidos de Git. En una instalación nueva, aplica las migraciones y registra tus cuentas.

## Preparación

Desde esta carpeta, con el entorno Python del proyecto activado:

```powershell
python -m flask --app app db upgrade
python -m flask --app app set-admin TU_USUARIO
python -m flask --app app run
```

Registra tu cuenta antes de ejecutar `set-admin`. Este comando local permite designar el primer administrador sin abrir un registro público de administradores. Sustituye `TU_USUARIO` por tu nombre de usuario exacto. Reinicia el backend si estaba abierto e inicia sesión con esa cuenta; si ya tenías sesión, recarga la página.

En React, abre **Administrar usuarios** en la barra de navegación. Selecciona Usuario o Administrador y pulsa **Guardar**. Un administrador no puede quitarse su propio rol.

Para borrar la cuenta de otro usuario, pulsa **Eliminar** y confirma la operación. La eliminación es permanente; también permite eliminar a otros administradores. El servidor impide eliminar la propia cuenta y rechaza las sesiones de cuentas eliminadas.

## API

Todas estas rutas requieren `Authorization: Bearer <token>`:

| Ruta | Acceso | Resultado |
| --- | --- | --- |
| `GET /me` | Cuenta autenticada | Perfil y rol actual |
| `GET /users` | Administrador | Lista de usuarios sin contraseñas |
| `PATCH /users/<id>/role` | Administrador | Cambia el rol con `{"role": "user"}` o `{"role": "admin"}` |
| `DELETE /users/<id>` | Administrador | Elimina otra cuenta; responde `204` si se elimina, `400` si es la propia cuenta o `404` si no existe |

El servidor consulta el rol actual en la base de datos en cada operación administrativa. La revocación de permisos afecta también a tokens emitidos previamente. React consulta `/me` al cargar la aplicación y al volver a la ventana para actualizar el perfil.

La variable opcional `DATABASE_URL` permite usar otra base de datos; por defecto se conserva `instance/db.sqlite3`.

## Verificación

```powershell
python -m unittest test_roles -v
```

Las pruebas usan una base SQLite en memoria y no modifican las cuentas locales. Cubren registro, permisos, promoción, revocación, validación de roles, eliminación de cuentas, comando local y migración con conservación de datos.
