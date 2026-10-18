# Login con React, Flask y JWT

Proyecto con frontend React y backend Flask en un solo repositorio. Incluye registro, inicio de sesión con JWT, cambio de contraseña y administración de usuarios.

## Estructura

```text
login-flask-jwt/             API Flask, modelos, migraciones y pruebas
login-reactvite-jwtextend/    Interfaz React con Vite y Bootstrap
```

## Funcionalidades

- Registro con rol Usuario (`user`) asignado automáticamente.
- Inicio de sesión y rutas protegidas.
- Cambio de contraseña.
- Panel exclusivo de administradores para asignar roles y eliminar otras cuentas.
- Protección para evitar que un administrador elimine su propia cuenta o se quite sus permisos.
- Pruebas del backend con una base de datos temporal.

## Ejecutar el backend

Requiere Python 3.13 y Pipenv. Desde la carpeta principal:

```powershell
cd .\login-flask-jwt
pipenv install
pipenv run python -m flask --app app db upgrade
pipenv run python app.py
```

Si ya activaste el entorno virtual, puedes ejecutar `python` directamente sin `pipenv run`. La API se inicia en `http://localhost:5000`.

## Ejecutar el frontend

Requiere Node.js compatible con Vite 8. En otra terminal, desde la carpeta principal:

```powershell
cd .\login-reactvite-jwtextend
npm ci
npm run dev
```

Abre la dirección que indique Vite, normalmente `http://localhost:5173`.

## Crear el primer administrador

Registra una cuenta desde la aplicación. Después, en la carpeta `login-flask-jwt`, ejecuta:

```powershell
pipenv run python -m flask --app app set-admin TU_USUARIO
```

Sustituye `TU_USUARIO` por el nombre exacto de la cuenta. Vuelve a iniciar sesión o recarga la página y abre **Administrar usuarios**. Desde allí puedes cambiar roles y eliminar cuentas con confirmación.

La base de datos local, sus cuentas y las contraseñas no se incluyen en el repositorio. Al clonar, aplica las migraciones y registra tus propias cuentas. La configuración actual del servidor corresponde al entorno de desarrollo.

## Verificación

Backend, desde `login-flask-jwt`:

```powershell
pipenv run python -m unittest test_roles -v
```

Frontend, desde `login-reactvite-jwtextend`:

```powershell
npm run lint
npm run build
```

Consulta [la documentación del backend](login-flask-jwt/README.md) para ver las rutas de la API y el comportamiento de los roles.
