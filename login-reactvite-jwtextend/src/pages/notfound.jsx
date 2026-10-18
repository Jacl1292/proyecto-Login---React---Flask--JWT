import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <>
      <h1>404</h1>
      <p>La página que buscas no existe.</p>

      <Link to="/">
        Volver al inicio
      </Link>
    </>
  )
}

export default NotFound