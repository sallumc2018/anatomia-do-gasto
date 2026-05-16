import Link from "next/link"

export default function TheoFloatingButton() {
  return (
    <Link
      href="/#theo"
      className="theo-floating-button"
      aria-label="Abrir o guia Théo"
    >
      <span className="theo-floating-button__mark" aria-hidden="true">T</span>
      <span className="theo-floating-button__text">
        <strong>Théo</strong>
        <span>Perguntar</span>
      </span>
    </Link>
  )
}
