/**
 * The books drifting up the page, carried over from the original prototype
 * (`criarLivrosFlutuantes` in legacy/index.html). Positions are fixed instead
 * of random so the server and the client render the same markup, and the whole
 * thing disappears for anyone who asks for reduced motion.
 */
const BOOKS = [
  { emoji: "📚", left: "6%", duration: "26s", delay: "0s", size: "1.5rem" },
  { emoji: "📖", left: "17%", duration: "31s", delay: "4s", size: "1.2rem" },
  { emoji: "📕", left: "28%", duration: "22s", delay: "9s", size: "1.8rem" },
  { emoji: "✨", left: "38%", duration: "28s", delay: "2s", size: "1.1rem" },
  { emoji: "📗", left: "47%", duration: "34s", delay: "12s", size: "1.4rem" },
  { emoji: "📘", left: "58%", duration: "24s", delay: "6s", size: "1.7rem" },
  { emoji: "📙", left: "67%", duration: "30s", delay: "15s", size: "1.3rem" },
  { emoji: "📖", left: "76%", duration: "27s", delay: "1s", size: "1.6rem" },
  { emoji: "📚", left: "85%", duration: "33s", delay: "10s", size: "1.2rem" },
  { emoji: "✨", left: "93%", duration: "29s", delay: "18s", size: "1.5rem" },
] as const;

export function FloatingBooks() {
  return (
    <div aria-hidden className="floating-books">
      {BOOKS.map((book, index) => (
        <span
          key={index}
          className="floating-book"
          style={{
            left: book.left,
            fontSize: book.size,
            animationDuration: book.duration,
            animationDelay: book.delay,
          }}
        >
          {book.emoji}
        </span>
      ))}
    </div>
  );
}
